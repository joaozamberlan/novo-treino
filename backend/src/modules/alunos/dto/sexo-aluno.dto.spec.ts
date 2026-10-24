import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAlunoDto } from './create-aluno.dto';
import { UpdateAlunoDto } from './update-aluno.dto';

// Campos com erro de validação
const erros = async (cls: new () => object, corpo: object) =>
  (await validate(plainToInstance(cls, corpo))).map((e) => e.property);

describe('sexo do aluno', () => {
  const base = { nome: 'Ana', telefone: '11999990000' };

  it('cadastro aceita masculino, feminino e sem sexo', async () => {
    expect(await erros(CreateAlunoDto, { ...base, sexo: 'masculino' })).toEqual(
      [],
    );
    expect(await erros(CreateAlunoDto, { ...base, sexo: 'feminino' })).toEqual(
      [],
    );
    expect(await erros(CreateAlunoDto, base)).toEqual([]);
  });

  it('cadastro recusa valor fora da lista', async () => {
    expect(await erros(CreateAlunoDto, { ...base, sexo: 'male' })).toEqual([
      'sexo',
    ]);
  });

  it('edição aceita null para limpar e recusa valor fora da lista', async () => {
    expect(await erros(UpdateAlunoDto, { sexo: null })).toEqual([]);
    expect(await erros(UpdateAlunoDto, { sexo: 'feminino' })).toEqual([]);
    expect(await erros(UpdateAlunoDto, { sexo: 'F' })).toEqual(['sexo']);
  });
});
