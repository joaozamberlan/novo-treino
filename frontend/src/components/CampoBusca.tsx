import { useMemo, useRef, useState } from 'react';
import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover } from 'react-aria-components';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';

// Campo de busca dos modais (exercício na prescrição, aluno na cópia de
// periodização): a pessoa digita um pedaço do nome e escolhe na lista. Quem
// chama recebe o item escolhido e preenche os seletores do formulário; o
// campo volta a ficar vazio.

interface Props<T> {
  label: string;
  placeholder?: string;
  itens: T[];
  chave: (item: T) => number;
  texto: (item: T) => string;
  // Onde mais procurar além do texto (ex.: o grupo muscular do exercício)
  buscarTambemEm?: (item: T) => string;
  // Texto de apoio à direita: em vermelho (ex.: "já nesta ficha") e em cinza (ex.: o grupo)
  destaque?: (item: T) => string | undefined;
  apoio?: (item: T) => string | undefined;
  onEscolher: (item: T) => void;
}

// Sem acento e em minúsculas: "flexao" acha "Flexão"
const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const LIMITE = 30;

export function CampoBusca<T>({
  label,
  placeholder,
  itens,
  chave,
  texto,
  buscarTambemEm,
  destaque,
  apoio,
  onEscolher,
}: Props<T>) {
  const [busca, setBusca] = useState('');
  // A lista abre com a largura do campo inteiro (lupa incluída)
  const campoRef = useRef<HTMLDivElement>(null);

  // Cada palavra digitada precisa aparecer, em qualquer ordem: "sup decl"
  // acha "Supino declinado"; "ana sil" acha "Ana Paula Silva".
  const resultados = useMemo(() => {
    const palavras = normalizar(busca).split(/\s+/).filter(Boolean);
    if (palavras.length === 0) return [];
    return itens
      .filter((item) => {
        const alvo = normalizar(`${texto(item)} ${buscarTambemEm?.(item) ?? ''}`);
        return palavras.every((p) => alvo.includes(p));
      })
      .slice(0, LIMITE);
  }, [busca, itens, texto, buscarTambemEm]);

  return (
    <ComboBox
      className="seletor campo-busca"
      items={resultados.map((item) => ({ id: chave(item), item }))}
      inputValue={busca}
      onInputChange={setBusca}
      selectedKey={null}
      onSelectionChange={(k) => {
        const escolhido = resultados.find((item) => chave(item) === k);
        if (escolhido === undefined) return;
        onEscolher(escolhido);
        setBusca('');
      }}
      menuTrigger="input"
      // "Nenhum resultado" só com algo digitado; campo vazio fecha a lista
      allowsEmptyCollection={busca.trim().length > 0}
    >
      <Label className="form-label">{label}</Label>
      <div className="campo-busca-campo" ref={campoRef}>
        <MagnifyingGlassIcon size={15} aria-hidden="true" />
        <Input className="form-input" placeholder={placeholder} />
      </div>
      <Popover className="seletor-popover" offset={4} triggerRef={campoRef}>
        <ListBox
          className="seletor-lista"
          renderEmptyState={() => (
            <div className="campo-busca-vazio">Nada encontrado com “{busca.trim()}”</div>
          )}
        >
          {({ id, item }: { id: number; item: T }) => {
            const vermelho = destaque?.(item);
            const cinza = apoio?.(item);
            return (
              <ListBoxItem id={id} textValue={texto(item)} className="seletor-opcao">
                <span className="campo-busca-nome">{texto(item)}</span>
                {(vermelho || cinza) && (
                  <span className="seletor-opcao-fim">
                    {vermelho && <span className="seletor-opcao-detalhe">{vermelho}</span>}
                    {cinza && <span className="campo-busca-apoio">{cinza}</span>}
                  </span>
                )}
              </ListBoxItem>
            );
          }}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
