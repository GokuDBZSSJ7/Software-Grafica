const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho da pasta de backup
const backupDir = path.join(__dirname, '..', 'backups');

// Cria a pasta se não existir
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Verifica ambiente
const isDev = process.env.NODE_ENV === 'development';

// Caminho do banco
const dbPath = isDev
  ? path.join(__dirname, '..', 'grafica.db')
  : path.join(process.resourcesPath, 'grafica.db');

console.log(dbPath, "DB");

// Função que realiza o backup diário
function fazerBackupDiario() {
  const dataHoje = new Date().toISOString().split('T')[0]; // AAAA-MM-DD
  const nomeBackup = `grafica_${dataHoje}.db`;
  const caminhoDestino = path.join(backupDir, nomeBackup);

  if (fs.existsSync(caminhoDestino)) {
    console.log(`Backup de ${dataHoje} já existe.`);
    return;
  }

  fs.copyFile(dbPath, caminhoDestino, (err) => {
    if (err) {
      console.error('Erro ao fazer backup do banco de dados:', err.message);
    } else {
      console.log('✅ Backup criado com sucesso em:', caminhoDestino);
    }
  });
}

// Agendamento fixo para 03:00 da manhã
function agendarBackupDiarioFixo() {
  const agora = new Date();
  const proximaExecucao = new Date();

  proximaExecucao.setHours(3, 0, 0, 0); // 03:00 da manhã

  // Se já passou das 03:00 hoje, agenda pra amanhã
  if (agora >= proximaExecucao) {
    proximaExecucao.setDate(proximaExecucao.getDate() + 1);
  }

  const tempoAteProximaExecucao = proximaExecucao - agora;

  console.log(`⏰ Próximo backup agendado para: ${proximaExecucao.toLocaleString('pt-BR')}`);

  setTimeout(() => {
    fazerBackupDiario();

    // Depois do primeiro, agenda a cada 24h
    setInterval(fazerBackupDiario, 1000 * 60 * 60 * 24);
  }, tempoAteProximaExecucao);
}

// Conexão com o banco
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('📦 Banco de dados conectado com sucesso.');
  }
});

// Criação das tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_fantasia TEXT,
    razao_social TEXT,
    endereco TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    telefone TEXT,
    inscricao_estadual TEXT,
    cnpj TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ordens_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    data_entrada TEXT,
    data_entrega TEXT,
    alteracao INTEGER,
    mostrar_prova INTEGER,
    cores TEXT,
    sulfite INTEGER,
    duplex INTEGER,
    couche INTEGER,
    adesivo INTEGER,
    bond INTEGER,
    copiativo INTEGER,
    vias TEXT,
    formato TEXT,
    picotar TEXT,
    so_colado INTEGER,
    numeracao TEXT,
    condicoes_pagamento TEXT,
    status TEXT DEFAULT 'Em andamento',
    FOREIGN KEY(cliente_id) REFERENCES clientes(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS itens_ordem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_servico_id INTEGER,
    quantidade INTEGER,
    descricao TEXT,
    valor_unitario REAL,
    valor_total REAL,
    FOREIGN KEY(ordem_servico_id) REFERENCES ordens_servico(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS caixa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordem_servico_id INTEGER,
    tipo TEXT,
    descricao TEXT,
    c TEXT,
    valor REAL,
    data TEXT DEFAULT (date('now')),
    FOREIGN KEY(ordem_servico_id) REFERENCES ordens_servico(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orcamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome TEXT,
    cliente_cnpj TEXT,
    data TEXT DEFAULT (date('now')),
    observacoes TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS itens_orcamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orcamento_id INTEGER,
    quantidade INTEGER,
    descricao TEXT,
    valor_unitario REAL,
    valor_total REAL,
    FOREIGN KEY(orcamento_id) REFERENCES orcamentos(id)
  );`);

  fazerBackupDiario();

  agendarBackupDiarioFixo();
});

module.exports = db;
