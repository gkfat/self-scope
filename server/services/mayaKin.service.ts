import { BaseService } from './base.service';
import { FixedContentService } from './fixedContent.service';
import type { BirthKinResponse } from '../../shared/schemas/api/mayaKin.schema';
import { kinOf } from '../../shared/utils/mayaKin';

type MayaKinServiceOptions = { content?: FixedContentService };

export class MayaKinService extends BaseService {
    protected serviceName = 'maya-kin';

    private readonly content: FixedContentService;

    constructor(options: MayaKinServiceOptions = {}) {
        super();
        this.content = options.content ?? new FixedContentService();
    }

    /**
     * The Kin of a birth date and its written content. Free, nothing stored, no AI (RULE-017): content that is
     * not published is a 404, never a fallback.
     */
    async birthKin(birthDate: string): Promise<BirthKinResponse> {
        const kin = kinOf(birthDate);
        const content = await this.content.getPublished('KIN_BIRTH', String(kin.kinNumber));

        return {
            kin, content,
        };
    }
}
