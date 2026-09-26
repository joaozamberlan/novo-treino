import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EncerrarSessaoDto, SalvarSeriesDto } from './series.dto';

// As rotas /publico não têm login: o body é validado pelo ValidationPipe
// global (whitelist + transform), reproduzido aqui direto contra os DTOs.
async function valida<T extends object>(cls: new () => T, body: unknown) {
  return validate(plainToInstance(cls, body) as object, { whitelist: true });
}

describe('DTOs públicos de séries', () => {
  it('aceita séries válidas, com campos nulos ou ausentes', async () => {
    const errors = await valida(SalvarSeriesDto, {
      series: [
        { numeroSerie: 1, cargaKg: 32.5, repeticoes: 10, concluido: true },
        { numeroSerie: 2, cargaKg: null, repeticoes: null },
        { numeroSerie: 3 },
      ],
    });
    expect(errors).toHaveLength(0);
  });

  it.each([
    ['numeroSerie negativo', { numeroSerie: -1 }],
    ['numeroSerie decimal', { numeroSerie: 1.5 }],
    ['numeroSerie gigante', { numeroSerie: 1_000_000 }],
    ['carga negativa', { numeroSerie: 1, cargaKg: -10 }],
    ['carga texto', { numeroSerie: 1, cargaKg: 'abc' }],
    ['repetições decimais', { numeroSerie: 1, repeticoes: 8.5 }],
    ['concluido não booleano', { numeroSerie: 1, concluido: 'sim' }],
  ])('rejeita %s', async (_caso, serie) => {
    const errors = await valida(SalvarSeriesDto, { series: [serie] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita listas de séries acima do limite', async () => {
    const series = Array.from({ length: 31 }, (_, i) => ({
      numeroSerie: (i % 30) + 1,
    }));
    const errors = await valida(SalvarSeriesDto, { series });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita body sem o array de séries', async () => {
    const errors = await valida(SalvarSeriesDto, {});
    expect(errors.length).toBeGreaterThan(0);
  });

  it('encerrar aceita body vazio e valida as séries de cada exercício', async () => {
    expect(await valida(EncerrarSessaoDto, {})).toHaveLength(0);

    const errors = await valida(EncerrarSessaoDto, {
      exercicios: [{ idTreinoExercicio: 7, series: [{ numeroSerie: 0 }] }],
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
