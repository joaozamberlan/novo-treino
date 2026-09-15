import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProtocoloDto } from './update-protocolo.dto';
import { UpdateTreinoDto } from './update-treino.dto';
import { UpdateTreinoExercicioDto } from './update-treino-exercicio.dto';

// Regressão do achado HIGH "mass assignment" da auditoria: os controllers de
// treinos.controller.ts usam ValidationPipe({whitelist:true,
// forbidNonWhitelisted:true}) exatamente para que um corpo de PATCH como
// { "idProfissional": 999 } seja rejeitado em vez de silenciosamente aceito
// e repassado ao Prisma. Este teste reproduz a mesma configuração de
// validação usada nos controllers, direto contra os DTOs.
async function validaComoOControllerValida<T extends object>(dto: T) {
  return validate(dto, { whitelist: true, forbidNonWhitelisted: true });
}

describe('DTOs de treinos — campos de posse nunca são aceitos no body', () => {
  it('UpdateProtocoloDto rejeita idProfissional/idAluno/idProtocolo enviados pelo cliente', async () => {
    const maliciosoInstance = plainToInstance(UpdateProtocoloDto, {
      nome: 'Novo nome legítimo',
      idProfissional: 999, // tentativa de sequestrar o protocolo para outro treinador
      idAluno: 999,
      idProtocolo: 999,
    });

    const errors = await validaComoOControllerValida(maliciosoInstance);
    expect(errors.length).toBeGreaterThan(0);
    const camposRejeitados = errors.map((e) => e.property);
    expect(camposRejeitados).toEqual(
      expect.arrayContaining(['idProfissional', 'idAluno', 'idProtocolo']),
    );
  });

  it('UpdateTreinoDto rejeita idProtocolo enviado pelo cliente', async () => {
    const maliciosoInstance = plainToInstance(UpdateTreinoDto, {
      nome: 'Ficha renomeada',
      idProtocolo: 999, // tentativa de mover a ficha para o protocolo de outro treinador
    });

    const errors = await validaComoOControllerValida(maliciosoInstance);
    expect(errors.map((e) => e.property)).toContain('idProtocolo');
  });

  it('UpdateTreinoExercicioDto rejeita idTreino enviado pelo cliente', async () => {
    const maliciosoInstance = plainToInstance(UpdateTreinoExercicioDto, {
      series: 4,
      idTreino: 999, // tentativa de mover a prescrição para outra ficha
    });

    const errors = await validaComoOControllerValida(maliciosoInstance);
    expect(errors.map((e) => e.property)).toContain('idTreino');
  });

  it('UpdateProtocoloDto aceita normalmente um payload só com campos legítimos', async () => {
    const instance = plainToInstance(UpdateProtocoloDto, {
      nome: 'Novo nome',
      ativo: true,
    });

    const errors = await validaComoOControllerValida(instance);
    expect(errors).toHaveLength(0);
  });
});
