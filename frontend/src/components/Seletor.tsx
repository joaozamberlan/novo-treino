import { Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue } from 'react-aria-components';
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react';

// Select do app, no lugar do <select> nativo. Comportamento (teclado,
// digitar para achar, leitor de tela, envio no form) vem do React Aria;
// o visual é todo nosso, em index.css (.seletor-*).
//
// Os valores seguem os do <select> antigo: um valor que não está nas opções
// (o 0 de "Selecione...") mostra o placeholder. O React Aria não aceita
// chave vazia, então '' vira uma chave própria aqui dentro.
export type ValorSeletor = string | number;

export interface OpcaoSeletor<V extends ValorSeletor> {
  valor: V;
  texto: string;
  // Texto de apoio à direita, em mono pequeno (ex.: "em Upper")
  detalhe?: string;
  desabilitada?: boolean;
}

interface SeletorProps<V extends ValorSeletor> {
  label?: string;
  // Sem label visível (ex.: filtro na barra da Biblioteca)
  ariaLabel?: string;
  valor: V;
  opcoes: OpcaoSeletor<V>[];
  onChange: (valor: V) => void;
  placeholder?: string;
  obrigatorio?: boolean;
  desabilitado?: boolean;
  className?: string;
}

const chave = (v: ValorSeletor) => `v:${v}`;

export function Seletor<V extends ValorSeletor>({
  label,
  ariaLabel,
  valor,
  opcoes,
  onChange,
  placeholder = 'Selecione...',
  obrigatorio,
  desabilitado,
  className,
}: SeletorProps<V>) {
  const selecionada = opcoes.find((o) => o.valor === valor);

  return (
    <Select
      className={`seletor${className ? ` ${className}` : ''}`}
      aria-label={label ? undefined : ariaLabel}
      selectedKey={selecionada ? chave(selecionada.valor) : null}
      onSelectionChange={(k) => {
        const opcao = opcoes.find((o) => chave(o.valor) === k);
        if (opcao) onChange(opcao.valor);
      }}
      disabledKeys={opcoes.filter((o) => o.desabilitada).map((o) => chave(o.valor))}
      placeholder={placeholder}
      isRequired={obrigatorio}
      isDisabled={desabilitado}
    >
      {label && <Label className="form-label">{label}</Label>}
      <Button className="seletor-botao">
        <SelectValue className="seletor-valor" />
        <CaretDownIcon size={14} className="seletor-seta" aria-hidden="true" />
      </Button>
      <Popover className="seletor-popover" offset={4}>
        <ListBox className="seletor-lista">
          {opcoes.map((o) => (
            <ListBoxItem key={chave(o.valor)} id={chave(o.valor)} textValue={o.texto} className="seletor-opcao">
              {({ isSelected }) => (
                <>
                  <span>{o.texto}</span>
                  {(o.detalhe || isSelected) && (
                    <span className="seletor-opcao-fim">
                      {o.detalhe && <span className="seletor-opcao-detalhe">{o.detalhe}</span>}
                      {isSelected && <CheckIcon size={14} className="seletor-opcao-check" aria-hidden="true" />}
                    </span>
                  )}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
