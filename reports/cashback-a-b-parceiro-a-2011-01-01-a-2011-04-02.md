# Cashback A/B — Parceiro A (2011-01-01 a 2011-04-02)

**Parceiro:** Parceiro A  |  **Periodo:** 2011-01-01 a 2011-04-02 (92 dias)  |  **Variantes:** Grupo 1, Grupo 2, Grupo 3  |  **Controle:** Grupo 1

## 1. Decisao

> ⛔ Manter **Grupo 1** (controle) — nenhuma variante venceu

Nenhuma variante superou o controle (Grupo 1) em receita liquida (comissao - cashback). Manter o controle em 100% do trafego.

**Metrica de decisao:** receita liquida do Meliuz = comissao recebida do parceiro − cashback distribuido. GMV e compradores sao metricas de apoio: cashback maior quase sempre gera mais volume, mas so vale escalar se sobrar mais margem.

## 2. Resultados consolidados

| Variante | Dias | Compradores | GMV | Comissao | Cashback | Receita liquida | Ticket medio | % cashback / GMV | Margem liquida | Liquido / comprador |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Grupo 1** (controle) | 92 | 9.633 | R$ 5.605.173 | R$ 638.135 | R$ 233.424 | **R$ 404.711** | R$ 582 | 4.16% | 7.22% | R$ 42 |
| **Grupo 2** | 92 | 10.814 | R$ 6.423.096 | R$ 728.178 | R$ 370.659 | **R$ 357.519** | R$ 594 | 5.77% | 5.57% | R$ 33 |
| **Grupo 3** | 92 | 11.410 | R$ 6.785.856 | R$ 767.887 | R$ 503.600 | **R$ 264.287** | R$ 595 | 7.42% | 3.89% | R$ 23 |

## 3. Comparacao vs controle

| Variante | Δ Receita liquida | Δ liquido/comprador | Δ GMV | Δ Compradores | Δ Ticket | Impacto liquido no periodo | p-valor | Significante (α=0.05) |
|---|---:|---:|---:|---:|---:|---:|---:|:--:|
| **Grupo 2** | -11.7% | -21.3% | +14.6% | +12.3% | +2.1% | -R$ 47.192 | 0.0000 | Sim |
| **Grupo 3** | -34.7% | -44.9% | +21.1% | +18.4% | +2.2% | -R$ 140.424 | 0.0000 | Sim |

O p-valor vem de um teste t de Welch sobre a serie diaria de receita liquida por comprador (variancias desiguais, amostras possivelmente desbalanceadas).

## 4. Leitura critica dos dados

- 276 de 276 linhas aproveitadas na analise.
- 3 dia(s) atipico(s) de GMV (|z| ≥ 3,5), que podem inflar medias: Grupo 2 2011-01-13 (R$ 230.953, z=4.28), Grupo 1 2011-01-13 (R$ 185.913, z=3.9), Grupo 3 2011-01-13 (R$ 228.467, z=3.75)

## 5. Proximos passos sugeridos

1. Manter **Grupo 1** no ar — nao ha ganho liquido comprovado.
2. Estender o teste ou aumentar a amostra antes de nova decisao.
3. Revisar dias atipicos e janelas de data antes de reanalisar.

_Gerado automaticamente em 2026-08-16T22:22:46+00:00 a partir de `dataset_01_parceiroA.csv`._
