## Problema Do Caixeiro Viajante com algoritimo ACO
### Trabalho Materia de IA do Prof. Ney
### https://sortphy.github.io/caixeiro/

---------

## Equipe:
- Maruan Biasi
- Icaro Botelho
- Gustavo Martins
- Thiago Saraiva
- Ricardo Falcão

---------

### Explicação Original da Tarefa:
- **Objetivo:** Dado 4 cidades (A, B, C e D) com distâncias conhecidas, usar algoritmo ACO para encontrar o menor caminho possível passando por todas as cidades e voltando à origem.

- Exemplo de distâncias entre cidades (grafo):
    - ('A', 'B'): 10
    - ('A', 'C'): 15
    - ('A', 'D'): 20
    - ('B', 'C'): 35
    - ('B', 'D'): 25
    - ('C', 'D'): 30

- Gerar um gráfico mostrando a evolução do caminho.

---------
### Visualização das Cidades Originais:

![8fc30aad-e40b-4511-acd4-e6cf288ce57c](https://github.com/user-attachments/assets/055523ee-8600-493f-898c-fd5dcc6abe68)


---------
### Nossa implementação conta com:
- Novos mapas podem ser gerados dinamicamente com qualquer número de cidades.
- Todos os mapas gerados possuem visualização em escala real das distâncias.
- Ao passar o mouse sobre os caminhos, é apresentado o comprimento daquela conexão.
- Animação de todo o processo de ACO:
    - Formigas representadas e animadas individualmente.
    - Níveis de feromônios em cada caminho são representados por cores.
    - Caminhos com formiga são destacados.
    - O atual melhor caminho pode ser isolado para melhor visualização.
- Equação de ACO com valores customizáveis:
    - Velocidade: Velocidade em que o algoritmo roda, pode ser alterada para melhor visualização gráfica.
    - Alfa: Influência dos feromônios nas decisões das formigas.
    - Beta: Influência das distâncias nas decisões das formigas.
    - Iterações: Quantas vezes o algoritmo vai ser rodado.
    - Formigas: Número total de formigas no sistema.
    - Evaporação: Taxa de evaporação dos feromônios.
    - Feromônio: Quantidade de feromônios depositados por cada formiga.
    - Reforço da Melhor Rota: Faz com que a formiga com a melhor rota deposite mais feromônios.
    - Velocidade máxima: Remove animações e otimiza o algorítimo e o navegador para executar na velocidade mais alta possível.

