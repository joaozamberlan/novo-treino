import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query params opcionais de paginação (`?page=1&limit=20`) para endpoints de
 * listagem. Quando omitidos, o service aplica um limite padrão generoso —
 * a resposta continua sendo um array simples (não um envelope paginado),
 * para não quebrar os consumidores atuais do frontend. O teto de 100 evita
 * que uma listagem cresça sem limite conforme a base de dados aumenta.
 */
export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number;
}

export const DEFAULT_PAGE_LIMIT = 1000;
export const MAX_PAGE_LIMIT = 1000;

export function toSkipTake(query?: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  const limit = Math.min(query?.limit ?? DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);
  const page = query?.page && query.page > 0 ? query.page : 1;
  return { skip: (page - 1) * limit, take: limit };
}
