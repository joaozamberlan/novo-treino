import { toast } from 'sonner';

// Gera o PDF da periodização a partir do #print-section renderizado pelo
// FichaPdf. O timeout dá tempo para modais fecharem antes da captura.
export function baixarPdfDoTreino(nomeAluno: string | undefined) {
  setTimeout(async () => {
    const element = document.getElementById('print-section');
    if (!element) return;

    const toastId = toast.loading('Gerando PDF…');

    // Aplica as regras @media print na própria página (e não só no clone do
    // html2canvas) para que o conteúdo print-only esteja visível e com o
    // tamanho certo quando o html2canvas medir.
    const printCss = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules);
        } catch {
          return [];
        }
      })
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.media.mediaText.includes('print'))
      .flatMap((rule) => Array.from(rule.cssRules))
      .map((rule) => rule.cssText)
      .join('\n');

    const styleTag = document.createElement('style');
    styleTag.textContent = printCss;
    document.head.appendChild(styleTag);

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const fileName = `Treino-${(nomeAluno || 'aluno').replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`;

      // Variável (e não objeto literal) porque os tipos do html2pdf.js não
      // declaram `pagebreak`, que a biblioteca aceita.
      const pdfOptions = {
        margin: [10, 12, 12, 12] as [number, number, number, number],
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(pdfOptions).from(element).save();

      toast.success('PDF gerado com sucesso!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar o PDF. Tente novamente.', { id: toastId });
    } finally {
      styleTag.remove();
    }
  }, 150);
}
