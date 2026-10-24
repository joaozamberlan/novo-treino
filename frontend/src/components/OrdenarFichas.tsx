import React, { useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { ArrowDownIcon, ArrowUpIcon, DotsSixVerticalIcon, XIcon } from '@phosphor-icons/react';
import { ModalPortal } from './ModalPortal';
import { fecharSoPeloTeclado } from '../utils/modal';
import type { FichaTreino } from '../types/treino';

// Ordem das fichas da periodização, num lugar só para isso. A letra da ficha
// (no PDF e na área do aluno) vem da posição, então cada linha mostra a letra
// que a ficha vai ter. Nada é gravado até "Salvar ordem".

const letra = (posicao: number) => String.fromCharCode(65 + posicao);

interface LinhaProps {
  ficha: FichaTreino;
  posicao: number;
  total: number;
  onMover: (direcao: -1 | 1) => void;
}

// Item isolado por precisar do próprio useDragControls (hooks não rodam dentro de .map())
const LinhaFicha: React.FC<LinhaProps> = ({ ficha, posicao, total, onMover }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={ficha}
      as="li"
      dragListener={false}
      dragControls={dragControls}
      className="ordenar-ficha"
      whileDrag={{ scale: 1.02, boxShadow: '0 14px 36px rgba(0, 0, 0, 0.22)', zIndex: 5 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
    >
      {/* Só a alça inicia o arrasto: no toque, a lista continua rolando pelo resto */}
      <span
        className="ordenar-ficha-alca"
        onPointerDown={(e) => dragControls.start(e)}
        aria-hidden="true"
      >
        <DotsSixVerticalIcon size={20} />
      </span>
      <span className="ordenar-ficha-letra" aria-hidden="true">{letra(posicao)}</span>
      <span className="ordenar-ficha-nome">{ficha.nome}</span>
      <span className="ordenar-ficha-acoes">
        <button
          type="button"
          className="exercise-action-btn"
          disabled={posicao === 0}
          onClick={() => onMover(-1)}
          aria-label={`Subir ${ficha.nome} (ficha ${letra(posicao)})`}
        >
          <ArrowUpIcon size={16} />
        </button>
        <button
          type="button"
          className="exercise-action-btn"
          disabled={posicao === total - 1}
          onClick={() => onMover(1)}
          aria-label={`Descer ${ficha.nome} (ficha ${letra(posicao)})`}
        >
          <ArrowDownIcon size={16} />
        </button>
      </span>
    </Reorder.Item>
  );
};

interface Props {
  fichas: FichaTreino[];
  onSalvar: (novaOrdem: FichaTreino[]) => void;
  onFechar: () => void;
}

export const OrdenarFichas: React.FC<Props> = ({ fichas, onSalvar, onFechar }) => {
  const [lista, setLista] = useState(fichas);
  const mudou = lista.some((f, i) => f.idTreino !== fichas[i]?.idTreino);

  const mover = (posicao: number, direcao: -1 | 1) => {
    const destino = posicao + direcao;
    if (destino < 0 || destino >= lista.length) return;
    const nova = [...lista];
    [nova[posicao], nova[destino]] = [nova[destino], nova[posicao]];
    setLista(nova);
  };

  return (
    <ModalPortal>
      <div
        className="modal-backdrop"
        onClick={fecharSoPeloTeclado(onFechar)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalOrdenarFichasTitulo"
      >
        <div className="modal-content modal-content--form" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
          <div className="modal-header">
            <h3 id="modalOrdenarFichasTitulo" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
              Ordenar fichas
            </h3>
            <button type="button" className="modal-close" onClick={onFechar} aria-label="Fechar ordenação das fichas">
              <XIcon size={18} />
            </button>
          </div>

          <p className="ordenar-fichas-ajuda">
            Arraste pela alça ou use as setas. A letra de cada ficha (no PDF e no app do aluno) segue a posição.
          </p>

          <Reorder.Group as="ol" axis="y" values={lista} onReorder={setLista} className="ordenar-fichas-lista">
            {lista.map((ficha, posicao) => (
              <LinhaFicha
                key={ficha.idTreino}
                ficha={ficha}
                posicao={posicao}
                total={lista.length}
                onMover={(direcao) => mover(posicao, direcao)}
              />
            ))}
          </Reorder.Group>

          <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onFechar}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!mudou}
              onClick={() => onSalvar(lista)}
            >
              Salvar ordem
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
