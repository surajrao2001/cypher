import { Injectable } from '@nestjs/common';

@Injectable()
export class IdentityService {
  currentUser(userId: string, jwtRole: string): { userId: string; jwtRole: string } {
    return { userId, jwtRole };
  }
}
