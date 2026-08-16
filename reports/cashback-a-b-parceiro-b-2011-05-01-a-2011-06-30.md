# Cashback A/B — Parceiro B (2011-05-01 a 2011-06-30)

**Parceiro:** Parceiro B  |  **Periodo:** 2011-05-01 a 2011-06-30 (61 dias)  |  **Variantes:** Grupo 1, Grupo 2, Grupo 3  |  **Controle:** Grupo 1

## 1. Decisao

> ⛔ Manter **Grupo 1** (controle) — nenhuma variante venceu

Nenhuma variante superou o controle (Grupo 1) em receita liquida (comissao - cashback). Manter o controle em 100% do trafego.

**Metrica de decisao:** receita liquida do Meliuz = comissao recebida do parceiro − cashback distribuido. GMV e compradores sao metricas de apoio: cashback maior quase sempre gera mais volume, mas so vale escalar se sobrar mais margem.

## 2. Resultados consolidados

| Variante | Dias | Compradores | GMV | Comissao | Cashback | Receita liquida | Ticket medio | % cashback / GMV | Margem liquida | Liquido / comprador |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Grupo 1** (controle) | 61 | 7.990 | R$ 4.094 | R$ 450 | R$ 164 | **R$ 287** | R$ 1 | 4.00% | 7.00% | R$ 0 |
| **Grupo 2** | 61 | 5.452 | R$ 2.863 | R$ 315 | R$ 172 | **R$ 143** | R$ 1 | 6.00% | 5.00% | R$ 0 |
| **Grupo 3** | 61 | 5.029 | R$ 2.630 | R$ 289 | R$ 237 | **R$ 53** | R$ 1 | 9.00% | 2.00% | R$ 0 |

## 3. Comparacao vs controle

| Variante | Δ Receita liquida | Δ liquido/comprador | Δ GMV | Δ Compradores | Δ Ticket | Impacto liquido no periodo | p-valor | Significante (α=0.05) |
|---|---:|---:|---:|---:|---:|---:|---:|:--:|
| **Grupo 2** | -50.0% | -26.8% | -30.1% | -31.8% | +2.5% | -R$ 143 | 0.0000 | Sim |
| **Grupo 3** | -81.6% | -70.8% | -35.8% | -37.1% | +2.1% | -R$ 234 | 0.0000 | Sim |

O p-valor vem de um teste t de Welch sobre a serie diaria de receita liquida por comprador (variancias desiguais, amostras possivelmente desbalanceadas).

## 4. Leitura critica dos dados

- 183 de 183 linhas aproveitadas na analise.
- 3 dia(s) atipico(s) de GMV (|z| ≥ 3,5), que podem inflar medias: Grupo 1 2011-05-15 (R$ 214, z=5.41), Grupo 2 2011-05-15 (R$ 159, z=5.21), Grupo 3 2011-05-15 (R$ 138, z=5.15)

## 5. Proximos passos sugeridos

1. Manter **Grupo 1** no ar — nao ha ganho liquido comprovado.
2. Estender o teste ou aumentar a amostra antes de nova decisao.
3. Revisar dias atipicos e janelas de data antes de reanalisar.

_Gerado automaticamente em 2026-08-16T22:22:13+00:00 a partir de `dataset_02_parceiroB.csv`._
