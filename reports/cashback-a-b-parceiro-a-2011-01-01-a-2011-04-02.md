# Cashback A/B — Parceiro A (2011-01-01 a 2011-04-02)

**Parceiro:** Parceiro A  |  **Periodo:** 2011-01-01 a 2011-04-02 (92 dias)  |  **Variantes:** Grupo 1, Grupo 2, Grupo 3  |  **Controle:** Grupo 1

## 1. Decisao

> ⚠️ Inconclusivo — manter **Grupo 1** e estender o teste

Grupo 2 lidera a receita liquida (+-87.1%), mas a diferenca no liquido por comprador nao e significante (p=0.0832). Manter o controle e estender o teste.

**Metrica de decisao:** receita liquida do Meliuz = comissao recebida do parceiro − cashback distribuido. GMV e compradores sao metricas de apoio: cashback maior quase sempre gera mais volume, mas so vale escalar se sobrar mais margem.

## 2. Resultados consolidados

| Variante | Dias | Compradores | GMV | Comissao | Cashback | Receita liquida | Ticket medio | % cashback / GMV | Margem liquida | Liquido / comprador |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Grupo 1** (controle) | 92 | 9.633 | R$ 5.605 | R$ 638 | R$ 5.176 | **-R$ 4.538** | R$ 1 | 92.35% | -80.97% | -R$ 0 |
| **Grupo 2** | 92 | 10.814 | R$ 6.423 | R$ 728 | R$ 1.313 | **-R$ 585** | R$ 1 | 20.44% | -9.10% | -R$ 0 |
| **Grupo 3** | 92 | 11.410 | R$ 6.786 | R$ 768 | R$ 2.256 | **-R$ 1.488** | R$ 1 | 33.24% | -21.93% | -R$ 0 |

## 3. Comparacao vs controle

| Variante | Δ Receita liquida | Δ liquido/comprador | Δ GMV | Δ Compradores | Δ Ticket | Impacto liquido no periodo | p-valor | Significante (α=0.05) |
|---|---:|---:|---:|---:|---:|---:|---:|:--:|
| **Grupo 2** | -87.1% | -88.5% | +14.6% | +12.3% | +2.1% | R$ 3.954 | 0.0832 | Nao |
| **Grupo 3** | -67.2% | -72.3% | +21.1% | +18.4% | +2.2% | R$ 3.050 | 0.2220 | Nao |

O p-valor vem de um teste t de Welch sobre a serie diaria de receita liquida por comprador (variancias desiguais, amostras possivelmente desbalanceadas).

## 4. Leitura critica dos dados

- 276 de 276 linhas aproveitadas na analise.
- 3 dia(s) atipico(s) de GMV (|z| ≥ 3,5), que podem inflar medias: Grupo 2 2011-01-13 (R$ 231, z=4.28), Grupo 1 2011-01-13 (R$ 186, z=3.9), Grupo 3 2011-01-13 (R$ 228, z=3.75)

## 5. Proximos passos sugeridos

1. Manter **Grupo 1** no ar — nao ha ganho liquido comprovado.
2. Estender o teste ou aumentar a amostra antes de nova decisao.
3. Revisar dias atipicos e janelas de data antes de reanalisar.

_Gerado automaticamente em 2026-08-16T22:22:12+00:00 a partir de `dataset_01_parceiroA.csv`._
