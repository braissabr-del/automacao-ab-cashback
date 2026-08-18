## Analisador Cashback Méliuz

Automação para análise de testes A/B de campanhas de cashback, desenvolvida em Python para transformar dados brutos em decisões acionáveis e relatórios automáticos.

O projeto foi desenvolvido como parte de um desafio técnico para uma posição de Operações Integradas, com foco em automação, análise de dados, qualidade da informação e apoio à tomada de decisão.

---

##  Objetivo

O Analisador Cashbach Méliuz recebe arquivos CSV contendo dados de diferentes grupos de usuários em testes A/B e realiza automaticamente:

* validação do schema esperado;
* tratamento de dados financeiros;
* cálculo de métricas de desempenho;
* identificação de possíveis problemas de qualidade dos dados;
* comparação entre grupos;
* definição da variante com melhor contribuição líquida;
* geração de um relatório em Markdown.

A proposta é reduzir análises manuais e transformar dados operacionais em uma recomendação objetiva.

---

##  Como funciona

O fluxo principal da automação é:

```text
                 CSV
                  │
                  ▼
        ┌───────────────────┐
        │ Leitura dos dados │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Validação Schema  │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Tratamento dados  │
        │    financeiros    │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Cálculo métricas  │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Data Quality Flag │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Comparação A/B    │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Recomendação      │
        │ de escala         │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │ Relatório .md     │
        └───────────────────┘
```

---

##  Estrutura do projeto

```text
ab-insight-automata/
│
├── analyze_ab.py
│
├── dataset_01_parceiroA.csv
├── dataset_02_parceiroB.csv
├── dataset_03_parceiroC.csv
│
└── reports/
    ├── dataset_01_parceiroA_relatorio.md
    ├── dataset_02_parceiroB_relatorio.md
    └── dataset_03_parceiroC_relatorio.md
```

### Arquivos principais

| Arquivo                    | Descrição                                        |
| -------------------------- | ------------------------------------------------ |
| `analyze_ab.py`            | Script responsável por toda a análise            |
| `dataset_01_parceiroA.csv` | Dataset de exemplo do Parceiro A                 |
| `dataset_02_parceiroB.csv` | Dataset de exemplo do Parceiro B                 |
| `dataset_03_parceiroC.csv` | Dataset de exemplo do Parceiro C                 |
| `reports/`                 | Diretório dos relatórios gerados automaticamente |

---

##  Tecnologias utilizadas

* **Python 3**
* **Pandas**
* **Argparse**
* **Pathlib**
* **Markdown**
* **Git / GitHub**

---

##  Métricas utilizadas

A automação calcula métricas financeiras para comparar o desempenho das variantes.

### Contribuição líquida

```text
Contribuição Líquida = Comissão - Cashback
```

Representa o valor restante após descontar o cashback da comissão.

### Margem líquida

```text
Margem Líquida = Contribuição Líquida / Vendas Totais
```

### Taxa de cashback

```text
Cashback Rate = Cashback / Vendas Totais
```

### Taxa de comissão

```text
Commission Rate = Comissão / Vendas Totais
```

---

##  Qualidade dos dados

Antes da comparação entre os grupos, o script identifica registros que podem comprometer a análise.

Uma linha é sinalizada quando apresenta, por exemplo:

* campos obrigatórios ausentes;
* quantidade de compradores menor ou igual a zero;
* vendas totais menor ou igual a zero;
* comissão negativa;
* cashback negativo;
* taxa de cashback superior a 20%;
* taxa de comissão superior a 30%.

Esses registros recebem uma flag de qualidade (`dq_flag`) e são desconsiderados da análise das métricas.

O relatório informa quantas linhas foram sinalizadas.

---

##  Critério de decisão

A variante vencedora é definida pela maior:

```text
Contribuição Líquida Média
```

Após a limpeza dos dados, os grupos são agregados e ordenados pela contribuição líquida média.

O grupo com maior resultado é apresentado como a variante recomendada para escala.

> Importante: a recomendação é baseada exclusivamente nos critérios implementados na automação. O projeto não pretende substituir uma análise estatística completa de significância ou inferência causal.

---

##  Como executar

### 1. Clonar o repositório

```bash
git clone https://github.com/braissabr-del/ab-insight-automata.git
```

### 2. Acessar a pasta

```bash
cd ab-insight-automata
```

### 3. Instalar a dependência

O projeto utiliza o Pandas.

```bash
pip install pandas
```

### 4. Executar uma análise

Para analisar o Parceiro A:

```bash
python analyze_ab.py dataset_01_parceiroA.csv
```

Para o Parceiro B:

```bash
python analyze_ab.py dataset_02_parceiroB.csv
```

Para o Parceiro C:

```bash
python analyze_ab.py dataset_03_parceiroC.csv
```

Também é possível definir uma pasta diferente para os relatórios:

```bash
python analyze_ab.py dataset_01_parceiroA.csv --output-dir meus_relatorios
```

---

##  Exemplo de saída

Ao executar:

```bash
python analyze_ab.py dataset_01_parceiroA.csv
```

o terminal apresenta:

```text
Decisão: escalar Grupo 1
Linhas sinalizadas: 9
Relatório: reports\dataset_01_parceiroA_relatorio.md
```

O relatório é criado automaticamente em:

```text
reports/dataset_01_parceiroA_relatorio.md
```

---

##  Resultados dos datasets de exemplo

A automação foi executada nos três datasets disponibilizados no projeto.

| Parceiro   | Decisão | Linhas sinalizadas |
| ---------- | ------- | -----------------: |
| Parceiro A | Grupo 1 |                  9 |
| Parceiro B | Grupo 1 |                  0 |
| Parceiro C | Grupo 1 |                  2 |

### Parceiro A

```text
Decisão: escalar Grupo 1
Linhas sinalizadas: 9
```

Métricas médias:

| Grupo   | Contribuição média | Margem líquida média |
| ------- | -----------------: | -------------------: |
| Grupo 1 |            4.55405 |                7.05% |
| Grupo 2 |            3.91635 |                5.60% |
| Grupo 3 |            2.90260 |                4.34% |

Resultado: **Grupo 1 recomendado para escala.**

---

##  Por que automatizar?

Em uma operação com múltiplos parceiros e testes simultâneos, realizar manualmente todas as etapas de:

```text
Receber dados
    ↓
Validar dados
    ↓
Calcular métricas
    ↓
Comparar grupos
    ↓
Tomar decisão
    ↓
Produzir relatório
```

pode gerar retrabalho e aumentar o risco de inconsistências.

O objetivo desta automação é criar um processo reprodutível, simples e auditável, permitindo que diferentes datasets sejam analisados seguindo as mesmas regras.

---

##  Próximas melhorias

Algumas evoluções possíveis para o projeto:

* [ ] Adicionar testes automatizados com `pytest`;
* [ ] Criar uma interface web para upload dos CSVs;
* [ ] Permitir processamento de vários parceiros em uma única execução;
* [ ] Criar gráficos de desempenho das variantes;
* [ ] Adicionar intervalos de confiança e testes estatísticos;
* [ ] Criar logs estruturados de execução;
* [ ] Exportar relatórios também em PDF ou Excel;
* [ ] Criar pipeline de CI/CD;
* [ ] Adicionar configuração externa para as regras de Data Quality;
* [ ] Integrar os resultados com ferramentas de BI.

---

##  Limitações atuais

A versão atual utiliza a contribuição líquida média como principal critério para definir a variante vencedora.

Isso significa que a automação ainda não realiza:

* teste de significância estatística;
* cálculo de poder estatístico;
* análise de intervalo de confiança;
* detecção automática de duração adequada do experimento;
* análise de viés ou balanceamento entre grupos.

Esses pontos fazem parte das possíveis evoluções do projeto.

---

##  Autora

**Brenda Raíssa Gonçalves Ferreira**

Estudante de Análise e Desenvolvimento de Sistemas, com experiência em operações, projetos, processos e melhoria contínua.

Atualmente direcionando minha trajetória para tecnologia, automação, dados e soluções que aproximem **negócio + tecnologia**.

 Conecte-se comigo

* GitHub: https://github.com/braissabr-del
* LinkedIn: https://www.linkedin.com/in/brendaf-erreira/

---

##  Licença

Este projeto foi desenvolvido para fins de estudo, portfólio e demonstração técnica.
