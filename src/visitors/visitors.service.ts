import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsProvider, SMS_PROVIDER } from '../auth/sms-provider';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { FollowUpDto } from './dto/follow-up.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { CrmProvider, CRM_PROVIDER } from '../crm/crm-provider';

@Injectable()
export class VisitorsService {
  private static NEXT_STAGE: Record<string, string> = {
    new: 'contacted',
    contacted: 'consultation',
    consultation: 'won',
  };

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private notifications: NotificationsService,
    @Inject(CRM_PROVIDER) private crm: CrmProvider,
    @Inject(SMS_PROVIDER) private sms: SmsProvider,
  ) {}

  async sendSms(id: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (!visitor.mobile) {
      throw new BadRequestException('Visitor has no mobile on file');
    }
    await this.sms.send(visitor.mobile, `Hi ${visitor.fullName}, this is a follow-up from Design Center. Let us know if you have any questions!`);

    await this.prisma.timelineEvent.create({
      data: {
        visitorId: id,
        label: 'SMS sent',
        detail: visitor.mobile,
      },
    });
    await this.prisma.visitor.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    });
    return { ok: true };
  }

  async sendEmail(id: string) {
    const visitor = await this.prisma.visitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');
    if (!visitor.email) {
      throw new BadRequestException('Visitor has no email on file');
    }

    // Send first — only record the timeline/notification if delivery succeeds.
    await this.mail.sendFollowUp(visitor.email, visitor.fullName);

    await this.prisma.timelineEvent.create({
      data: {
        visitorId: id,
        label: 'Follow-up email sent',
        detail: visitor.email,
      },
    });
    const updated = await this.prisma.visitor.update({
      where: { id },
      data: { lastContactedAt: new Date() },
      include: { timelineEvents: { orderBy: { timestamp: 'asc' } } },
    });
    await this.notifications.create({
      kind: 'email_sent',
      title: `Follow-up email sent to ${visitor.fullName}`,
      subtitle: visitor.email,
      visitorId: id,
    });
    return updated;
  }

  findByHostess(hostessId: string) {
    return this.prisma.visitor.findMany({
      where: { hostessId },
      orderBy: { createdAt: 'desc' },
      include: { timelineEvents: { orderBy: { timestamp: 'asc' } } },
    });
  }

  async findOne(id: string) {
    let v;
    try {
      v = await this.prisma.visitor.findUnique({
        where: { id },
        include: { timelineEvents: { orderBy: { timestamp: 'asc' } } },
      });
    } catch {
      throw new NotFoundException('Visitor not found');
    }
    if (!v) throw new NotFoundException('Visitor not found');
    return v;
  }

  async create(hostessId: string | null, data: CreateVisitorDto) {
    const visitor = await this.prisma.visitor.create({
      data: { ...(data as any), hostessId: hostessId ?? undefined },
    });
    const externalId = await this.crm
      .syncLead({
        id: visitor.id,
        fullName: visitor.fullName,
        email: visitor.email ?? undefined,
        mobile: visitor.mobile ?? undefined,
        city: visitor.city ?? undefined,
        leadSource: visitor.leadSource ?? undefined,
      })
      .catch(() => {});
    if (externalId) {
      await this.prisma.visitor.update({
        where: { id: visitor.id },
        data: { crmExternalId: externalId },
      });
    }
    return visitor;
  }

  update(id: string, data: UpdateVisitorDto, isAuthed = false) {
    const payload: any = { ...data };
    if (!isAuthed) {
      delete payload.stage;
      delete payload.assignedPartnerId;
      delete payload.lostReason;
      delete payload.nextFollowUpAt;
      delete payload.leadSource;
    }
    return this.prisma.visitor.update({ where: { id }, data: payload });
  }

  async remove(id: string) {
    await this.prisma.visitor.delete({ where: { id } });
  }

  async addTimelineEvent(
    visitorId: string,
    data: { label: string; detail?: string },
  ) {
    const visitor = await this.prisma.visitor.findUniqueOrThrow({
      where: { id: visitorId },
    });
    const event = await this.prisma.timelineEvent.create({
      data: { visitorId, ...data },
    });
    const note = data.detail
      ? `${data.label}: ${data.detail}`
      : data.label;
    this.crm.createNote(visitor.crmExternalId ?? visitorId, note).catch(() => {});
    return event;
  }

  async followUp(id: string, dto: FollowUpDto) {
    const visitor = await this.prisma.visitor.findUniqueOrThrow({
      where: { id },
    });
    const originalStage = visitor.stage ?? 'new';
    let stage = originalStage;
    let lostReason: string | null = visitor.lostReason ?? null;

    if (dto.outcome === 'advance') {
      stage = VisitorsService.NEXT_STAGE[stage] ?? stage; // terminal stays
    } else if (dto.outcome === 'won') {
      stage = 'won';
    } else if (dto.outcome === 'lost') {
      stage = 'lost';
      lostReason = dto.lostReason ?? lostReason;
    }
    // 'note' leaves stage unchanged

    const stageChanged = stage !== originalStage;

    const updated = await this.prisma.visitor.update({
      where: { id },
      data: {
        stage,
        lostReason,
        lastContactedAt: new Date(),
        nextFollowUpAt: dto.nextFollowUpAt
          ? new Date(dto.nextFollowUpAt)
          : visitor.nextFollowUpAt,
      },
    });

    if (stageChanged) {
      this.crm.updateLeadStage(visitor.crmExternalId ?? id, stage).catch(() => {});
    }

    await this.prisma.timelineEvent.create({
      data: {
        visitorId: id,
        label: dto.outcome === 'note' ? 'Follow-up note' : `Stage → ${stage}`,
        detail: dto.note ?? undefined,
      },
    });

    return updated;
  }
}
