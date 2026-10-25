import { BaseRepository } from './base.repository';
import type { UserDoc } from '../../shared/schemas/firestore/user.schema';

export class UserRepository extends BaseRepository<UserDoc> {
    protected collectionName = 'users';
}
