// hooks/usePDFRotinaEmail.ts
import * as Print from 'expo-print';
import { useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

interface PDFRotinaEmailParams {
  rotinaId: string;
  alunoEmail: string;
  nomeAluno: string;
  nomePersonal: string;
}

export const usePDFRotinaEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Buscar dados REAIS da rotina no Supabase
  const buscarDadosRotina = async (rotinaId: string): Promise<any> => {
    console.log('📊 Buscando dados da rotina:', rotinaId);

    const { data, error } = await supabase
      .from('rotinas')
      .select(`
        id,
        nome,
        descricao,
        objetivo,
        treinos_por_semana,
        duracao_semanas,
        dificuldade,
        aluno_id,
        personal_trainer_id,
        alunos!inner (
          nome_completo,
          email
        ),
        personal_trainers!inner (
          nome_completo,
          telefone
        ),
        treinos (
          id,
          nome,
          grupos_musculares,
          tempo_estimado_minutos,
          observacoes,
          ordem,
          exercicios_rotina (
            id,
            exercicio_1,
            exercicio_2,
            ordem,
            intervalo_apos_exercicio,
            observacoes,
            series (
              numero_serie,
              repeticoes,
              carga,
              tem_dropset,
              carga_dropset,
              repeticoes_1,
              carga_1,
              repeticoes_2,
              carga_2,
              intervalo_apos_serie,
              observacoes
            )
          )
        )
      `)
      .eq('id', rotinaId)
      .order('ordem', { foreignTable: 'treinos' })
      .order('ordem', { foreignTable: 'treinos.exercicios_rotina' })
      .order('numero_serie', { foreignTable: 'treinos.exercicios_rotina.series' })
      .single();

    if (error) {
      console.error('❌ Erro ao buscar rotina:', error);
      throw new Error(`Erro ao buscar rotina: ${error.message}`);
    }

    if (!data) {
      throw new Error('Rotina não encontrada');
    }

    console.log('✅ Dados da rotina carregados:', {
      nome: data.nome,
      aluno: (data.alunos as any)?.nome_completo,
      personal: (data.personal_trainers as any)?.nome_completo,
      treinos: data.treinos?.length || 0,
      exercicios: data.treinos?.reduce((acc: number, t: any) => acc + (t.exercicios_rotina?.length || 0), 0) || 0
    });

    return data;
  };

  // ✅ Ícones SVG do Lucide
  const lucideIcons = {
    clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
      <circle cx="6" cy="6" r="3"/>
      <path d="m9 12 2 2 4-4"/>
      <path d="M12 1v6"/>
      <path d="M16.5 7.5v3"/>
      <path d="M20.5 10.5v1"/>
      <path d="M12 19v2"/>
      <circle cx="12" cy="12" r="7"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>`,
    
    lightbulb: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A11E0A" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>`,
    
    phone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A11E0A" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>`,
    
    hash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A11E0A" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
      <line x1="4" x2="20" y1="9" y2="9"/>
      <line x1="4" x2="20" y1="15" y2="15"/>
      <line x1="10" x2="8" y1="3" y2="21"/>
      <line x1="16" x2="14" y1="3" y2="21"/>
    </svg>`
  };

  // ✅ Gerar HTML para PDF usando expo-print (OFICIAL e funciona!)
  const gerarHTMLRotina = (rotina: any): string => {
    const formatarSerie = (serie: any, exercicio: any) => {
      if (exercicio.exercicio_2) {
        return `
          <div style="margin-bottom: 8px;">
            <strong>${exercicio.exercicio_1}:</strong> ${serie.repeticoes_1 || 0} reps ${serie.carga_1 ? `- ${serie.carga_1}kg` : ''}<br>
            <strong>${exercicio.exercicio_2}:</strong> ${serie.repeticoes_2 || 0} reps ${serie.carga_2 ? `- ${serie.carga_2}kg` : ''}
          </div>
        `;
      }
      
      let serieHtml = `${serie.repeticoes || 0} reps`;
      if (serie.carga) serieHtml += ` - ${serie.carga}kg`;
      if (serie.tem_dropset && serie.carga_dropset) {
        serieHtml += ` + Dropset ${serie.carga_dropset}kg`;
      }
      
      return `<div style="margin-bottom: 4px;">${serieHtml}</div>`;
    };

    const formatarTempo = (segundos: number) => {
      if (segundos >= 60) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return segs > 0 ? `${minutos}min ${segs}s` : `${minutos}min`;
      }
      return `${segundos}s`;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rotina de Treino - ${rotina.nome}</title>
        <style>
        @page {
          margin: 20px;
          size: A4;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          font-size: 14px;
        }
        .header {
          background: #F3F4F6;
          color: #222;
          padding: 30px 20px 18px 20px;
          text-align: center;
          margin-bottom: 30px;
          border-radius: 8px;
        }
        .logo-titans {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin: 0 auto 8px auto;
        }
        .info-geral {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid #e9ecef;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          align-items: center;
        }
        .info-label {
          font-weight: 600;
          color: #666;
        }
        .treino {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          margin-bottom: 25px;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .treino-header {
          background: #A11E0A;
          color: white;
          padding: 15px 20px;
          font-weight: 600;
          font-size: 16px;
        }
        .treino-info {
          padding: 15px 20px;
          background: #f8f9ff;
          border-bottom: 1px solid #e9ecef;
          font-size: 13px;
          color: #666;
        }
        .exercicio {
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }
        .exercicio:last-child {
          border-bottom: none;
        }
        .exercicio-nome {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 12px;
        }
        .exercicio-combinado {
          color: #A11E0A;
        }
        .series-container {
          margin: 15px 0;
        }
        .serie {
          display: flex;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .serie:last-child {
          border-bottom: none;
        }
        .serie-numero {
          background: #A11E0A;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .serie-detalhes {
          flex: 1;
        }
        .intervalo {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
          font-style: italic;
          display: flex;
          align-items: center;
        }
        .observacoes {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 13px;
          color: #856404;
          display: flex;
          align-items: flex-start;
        }
        .footer {
          margin-top: 40px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          text-align: center;
          font-size: 13px;
          color: #666;
          border: 1px solid #e9ecef;
        }
        .contato-pt {
          font-weight: 600;
          color: #A11E0A;
          margin-bottom: 8px;
        }
        .telefone {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 8px 0;
        }
        .page-break {
          page-break-before: always;
        }
        .btn, a.btn, button.btn {
          background: #A11E0A;
          color: #fff !important;
          border: none;
          border-radius: 6px;
          padding: 12px 28px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          margin: 12px 0;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn:hover, a.btn:hover, button.btn:hover {
          background: #871900;
        }
        </style>
      </head>
    <body>
      <div class="header">
         <div class="logo-titans">
           <img src="https://prvfvlyzfyprjliqniki.supabase.co/storage/v1/object/public/assets/TitanFitnessLogo.png" alt="Titans Fitness Logo" style="height: 100px; width: auto; max-width: 300px; display: block; margin: 0 auto 8px auto; border-radius: 8px;" />
         </div>
      </div>
      
      <div class="info-geral">
        <h1 style="font-size: 24px; margin-bottom: 20px; color: #1a1a1a;">${rotina.nome}</h1>
        
        <div class="info-row">
          <span class="info-label">Aluno:</span>
          <span>${(rotina.alunos as any)?.nome_completo || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Personal Trainer:</span>
          <span>${(rotina.personal_trainers as any)?.nome_completo || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Objetivo:</span>
          <span>${rotina.objetivo || 'Não especificado'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Frequência:</span>
          <span>${rotina.treinos_por_semana}x por semana</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duração:</span>
          <span>${rotina.duracao_semanas} semanas</span>
        </div>
        <div class="info-row">
          <span class="info-label">Dificuldade:</span>
          <span>${rotina.dificuldade || 'Não especificado'}</span>
        </div>
        
        ${rotina.descricao ? `
          <div style="margin-top: 15px;">
            <div class="info-label" style="margin-bottom: 8px;">Descrição:</div>
            <div style="color: #666; font-style: italic;">${rotina.descricao}</div>
          </div>
        ` : ''}
      </div>
      
      ${rotina.treinos?.map((treino: any, index: number) => `
        ${index > 0 ? '<div class="page-break"></div>' : ''}
        <div class="treino">
          <div class="treino-header">
            ${treino.nome}
          </div>
          <div class="treino-info">
            <strong>Grupos Musculares:</strong> ${treino.grupos_musculares || 'Não especificado'} | 
            <strong>Tempo Estimado:</strong> ${treino.tempo_estimado_minutos || 0} min
            ${treino.observacoes ? `<br><strong>Observações:</strong> ${treino.observacoes}` : ''}
          </div>
          
          ${treino.exercicios_rotina?.map((exercicio: any) => `
            <div class="exercicio">
              <div class="exercicio-nome ${exercicio.exercicio_2 ? 'exercicio-combinado' : ''}">
                ${exercicio.exercicio_2 ? 
                  `${exercicio.exercicio_1} + ${exercicio.exercicio_2}` : 
                  exercicio.exercicio_1
                }
              </div>
              
              <div class="series-container">
                ${exercicio.series?.map((serie: any) => `
                  <div class="serie">
                    <div class="serie-numero">${serie.numero_serie}</div>
                    <div class="serie-detalhes">
                      ${formatarSerie(serie, exercicio)}
                      ${serie.observacoes ? `
                        <div class="observacoes">
                          ${lucideIcons.lightbulb}
                          <span>${serie.observacoes}</span>
                        </div>
                      ` : ''}
                      ${serie.intervalo_apos_serie > 0 ? `
                        <div class="intervalo">
                          ${lucideIcons.clock}
                          <span>Descanso: ${formatarTempo(serie.intervalo_apos_serie)}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('') || '<div class="serie-detalhes">Nenhuma série configurada</div>'}
              </div>
              
              ${exercicio.intervalo_apos_exercicio > 0 ? `
                <div class="intervalo" style="text-align: center; margin-top: 15px; font-weight: 600; justify-content: center;">
                  ${lucideIcons.clock}
                  <span>Intervalo antes do próximo exercício: ${formatarTempo(exercicio.intervalo_apos_exercicio)}</span>
                </div>
              ` : ''}
              
              ${exercicio.observacoes ? `
                <div class="observacoes">
                  ${lucideIcons.lightbulb}
                  <span>${exercicio.observacoes}</span>
                </div>
              ` : ''}
            </div>
          `).join('') || '<div class="exercicio">Nenhum exercício configurado</div>'}
        </div>
      `).join('') || '<div class="treino"><div class="treino-header">Nenhum treino configurado</div></div>'}
      
      <div class="footer">
        <div class="contato-pt">Contato do Personal Trainer</div>
        <div>${(rotina.personal_trainers as any)?.nome_completo || 'N/A'}</div>
        ${((rotina.personal_trainers && (rotina.personal_trainers as any).telefone) ? `
          <div class="telefone">
            ${lucideIcons.phone}
            <span>${(rotina.personal_trainers as any).telefone}</span>
          </div>
        ` : '')}
        <div style="margin-top: 15px; font-size: 12px; color: #999;">
          Gerado via Titans Fitness em ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </body>
    </html>
    `;
  };

  // ✅ Função principal para enviar PDF por email
  const enviarPDFPorEmail = async ({ 
    rotinaId, 
    alunoEmail, 
    nomeAluno, 
    nomePersonal 
  }: PDFRotinaEmailParams) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando processo de envio de PDF...');
      
      // 1. Buscar dados da rotina
      const rotina = await buscarDadosRotina(rotinaId);
      
      // 2. Gerar HTML
      console.log('📝 Gerando HTML...');
      const htmlContent = gerarHTMLRotina(rotina);
      
      // 3. Gerar PDF usando expo-print (com fallback para web)
      console.log('📄 Gerando PDF...');
      
      // Se for web, sempre usar o fallback do servidor para evitar janela de impressão
      if (Platform.OS === 'web') {
        console.log('🌐 Web detected: enviando direto para o servidor (sem abrir janela de impressão)...');
        const supabaseResponse = await supabase.functions.invoke('enviar-rotina-pdf', {
          body: {
            html_content: htmlContent,
            nome_aluno: nomeAluno,
            email_aluno: alunoEmail,
            nome_personal: (rotina.personal_trainers as any)?.nome_completo || 'Personal Trainer',
            nome_rotina: rotina.nome,
            objetivo: rotina.objetivo || ''
          }
        });
        const { data: functionData, error: functionError } = supabaseResponse;
        if (functionError) {
          throw new Error(`Erro na edge function: ${functionError.message}`);
        }
        if (!functionData?.success) {
          throw new Error(functionData?.error || 'Erro desconhecido no envio');
        }
        console.log('✅ PDF gerado e enviado via servidor!');
        await supabase
          .from('rotinas')
          .update({ pdf_email_enviado: true })
          .eq('id', rotinaId);
        return { success: true, messageId: functionData.messageId };
      }
      
      try {
        const pdfResult = await Print.printToFileAsync({
          html: htmlContent,
          base64: false  // ✅ Mudança: não forçar base64 inicialmente
        });
        
        console.log('📄 PDF Result:', pdfResult);
        
        // ✅ Verificar se temos resultado e URI válido (mobile)
        if (pdfResult && pdfResult.uri && !pdfResult.uri.includes('undefined')) {
          // 4. Converter para base64 (MOBILE)
          console.log('📱 Processando PDF no mobile...');
          const response = await fetch(pdfResult.uri);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.readAsDataURL(blob);
          });
          
          console.log('✅ PDF convertido para base64 (mobile)');
          
          // 5. Enviar via Edge Function
          console.log('📧 Enviando email...');
          const supabaseResponse = await supabase.functions.invoke('enviar-rotina-pdf', {
            body: {
              pdf_base64: base64,
              nome_aluno: nomeAluno,
              email_aluno: alunoEmail,
              nome_personal: (rotina.personal_trainers as any)?.nome_completo || 'Personal Trainer',
              nome_rotina: rotina.nome,
              objetivo: rotina.objetivo || ''
            }
          });

          const { data: functionData, error: functionError } = supabaseResponse;

          if (functionError) {
            throw new Error(`Erro na edge function: ${functionError.message}`);
          }

          if (!functionData?.success) {
            throw new Error(functionData?.error || 'Erro desconhecido no envio');
          }

          console.log('✅ PDF enviado com sucesso!');
          
          // 6. Marcar como enviado na rotina
          await supabase
            .from('rotinas')
            .update({ pdf_email_enviado: true })
            .eq('id', rotinaId);

          return { success: true, messageId: functionData.messageId };
          
        } else {
          // ✅ FALLBACK para WEB - gerar PDF via Edge Function
          console.log('🌐 Processando PDF no navegador (via servidor)...');
          
          const supabaseResponse = await supabase.functions.invoke('enviar-rotina-pdf', {
            body: {
              html_content: htmlContent,  // ✅ Enviar HTML em vez de base64
              nome_aluno: nomeAluno,
              email_aluno: alunoEmail,
              nome_personal: (rotina.personal_trainers as any)?.nome_completo || 'Personal Trainer',
              nome_rotina: rotina.nome,
              objetivo: rotina.objetivo || ''
            }
          });

          const { data: functionData, error: functionError } = supabaseResponse;

          if (functionError) {
            throw new Error(`Erro na edge function: ${functionError.message}`);
          }

          if (!functionData?.success) {
            throw new Error(functionData?.error || 'Erro desconhecido no envio');
          }

          console.log('✅ PDF gerado e enviado via servidor!');
          
          // Marcar como enviado na rotina
          await supabase
            .from('rotinas')
            .update({ pdf_email_enviado: true })
            .eq('id', rotinaId);

          return { success: true, messageId: functionData.messageId };
        }
        
      } catch (pdfError) {
        console.warn('⚠️ Erro no expo-print, usando fallback para servidor:', pdfError);
        
        // ✅ FALLBACK COMPLETO - gerar PDF no servidor
        const supabaseResponse = await supabase.functions.invoke('enviar-rotina-pdf', {
          body: {
            html_content: htmlContent,
            nome_aluno: nomeAluno,
            email_aluno: alunoEmail,
            nome_personal: (rotina.personal_trainers as any)?.nome_completo || 'Personal Trainer',
            nome_rotina: rotina.nome,
            objetivo: rotina.objetivo || ''
          }
        });

        const { data: functionData, error: functionError } = supabaseResponse;

        if (functionError) {
          throw new Error(`Erro na edge function: ${functionError.message}`);
        }

        if (!functionData?.success) {
          throw new Error(functionData?.error || 'Erro desconhecido no envio');
        }

        console.log('✅ PDF gerado e enviado via servidor (fallback)!');
        
        await supabase
          .from('rotinas')
          .update({ pdf_email_enviado: true })
          .eq('id', rotinaId);

        return { success: true, messageId: functionData.messageId };
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao enviar PDF:', errorMessage);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    enviarPDFPorEmail,
    isLoading,
    error
  };
};