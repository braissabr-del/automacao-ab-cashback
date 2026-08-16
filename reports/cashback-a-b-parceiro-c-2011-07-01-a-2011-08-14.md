# Cashback A/B — Parceiro C (2011-07-01 a 2011-08-14)

**Parceiro:** Parceiro C  |  **Periodo:** 2011-07-01 a 2011-08-14 (45 dias)  |  **Variantes:** Grupo 1, Grupo 2  |  **Controle:** Grupo 1

## 1. Decisao

> ⛔ Manter **Grupo 1** (controle) — nenhuma variante venceu

Nenhuma variante superou o controle (Grupo 1) em receita liquida (comissao - cashback). Manter o controle em 100% do trafego.

**Metrica de decisao:** receita liquida do Meliuz = comissao recebida do parceiro − cashback distribuido. GMV e compradores sao metricas de apoio: cashback maior quase sempre gera mais volume, mas so vale escalar se sobrar mais margem.

## 2. Resultados consolidados

| Variante | Dias | Compradores | GMV | Comissao | Cashback | Receita liquida | Ticket medio | % cashback / GMV | Margem liquida | Liquido / comprador |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Grupo 1** (controle) | 45 | 4.549 | R$ 1.738.460 | R$ 121.693 | R$ 86.924 | **R$ 34.769** | R$ 382 | 5.00% | 2.00% | R$ 8 |
| **Grupo 2** | 45 | 4.522 | R$ 1.685.235 | R$ 117.967 | R$ 117.967 | **R$ 0** | R$ 373 | 7.00% | 0.00% | R$ 0 |

## 3. Comparacao vs controle

| Variante | Δ Receita liquida | Δ liquido/comprador | Δ GMV | Δ Compradores | Δ Ticket | Impacto liquido no periodo | p-valor | Significante (α=0.05) |
|---|---:|---:|---:|---:|---:|---:|---:|:--:|
| **Grupo 2** | -100.0% | -100.0% | -3.1% | -0.6% | -2.5% | -R$ 34.769 | 0.0000 | Sim |

O p-valor vem de um teste t de Welch sobre a serie diaria de receita liquida por comprador (variancias desiguais, amostras possivelmente desbalanceadas).

## 4. Leitura critica dos dados

- 90 de 90 linhas aproveitadas na analise.
- Nenhum dia atipico de GMV (|z| ≥ 3,5) detectado.

## 5. Proximos passos sugeridos

1. Manter **Grupo 1** no ar — nao ha ganho liquido comprovado.
2. Estender o teste ou aumentar a amostra antes de nova decisao.
3. Revisar dias atipicos e janelas de data antes de reanalisar.

_Gerado automaticamente em 2026-08-16T22:22:48+00:00 a partir de `dataset_03_parceiroC.csv`._
