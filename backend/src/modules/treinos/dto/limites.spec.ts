import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddExercicioDto } from './add-exercicio.dto';
import { UpdateTreinoExercicioDto } from './update-treino-exercicio.dto';

async function valida<T extends object>(cls: new () => T, body: unknown) {
  return validate(plainToInstance(cls, body) as object, { whitelist: true });
}

const PRESCRICAO_VALIDA = {
  idExercicio: 1,
  series: 3,
  repeticoes: '8-12',
  descansoSegundos: 60,
  descansoMaxSegundos: 90,
  ordem: 1,
};

describe('Limites numéricos da prescrição', () => {
  it('aceita uma prescrição válida', async () => {
    expect(await valida(AddExercicioDto, PRESCRICAO_VALIDA)).toHaveLength(0);
  });

  it.each([
    ['zero séries', { series: 0 }],
    ['séries negativas', { series: -3 }],
    ['séries demais', { series: 31 }],
    ['descanso negativo', { descansoSegundos: -10 }],
    ['descanso acima de 1h', { descansoMaxSegundos: 3601 }],
    ['ordem negativa', { ordem: -1 }],
    ['id de exercício inválido', { idExercicio: 0 }],
  ])('rejeita %s ao adicionar', async (_caso, campos) => {
    const errors = await valida(AddExercicioDto, {
      ...PRESCRICAO_VALIDA,
      ...campos,
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('aplica os mesmos limites ao editar', async () => {
    expect(await valida(UpdateTreinoExercicioDto, { series: 4 })).toHaveLength(
      0,
    );
    expect(
      (await valida(UpdateTreinoExercicioDto, { series: 1000 })).length,
    ).toBeGreaterThan(0);
  });
});
