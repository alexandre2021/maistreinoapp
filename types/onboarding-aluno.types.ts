export interface OnboardingAlunoData {
  nomeCompleto: string;
  genero: string;
  dataNascimento: string;
  telefone: string;
  peso: string;
  altura: string;
  descricaoPessoal: string;
  questionarioParQ: { [key: string]: boolean };
}
