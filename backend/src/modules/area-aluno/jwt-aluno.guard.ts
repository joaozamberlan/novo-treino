import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAlunoGuard extends AuthGuard('jwt-aluno') {}
