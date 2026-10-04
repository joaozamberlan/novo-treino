import { useContext } from 'react';
import { ConfirmarContext } from '../contexts/confirmarContext';

// Substitui o confirm() do navegador:
//   const confirmar = useConfirmar();
//   if (!(await confirmar({ titulo: 'Excluir a ficha?', confirmar: 'Excluir', perigo: true }))) return;
export const useConfirmar = () => useContext(ConfirmarContext);
