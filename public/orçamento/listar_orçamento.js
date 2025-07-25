(() => {
  const tabela = document.getElementById('tabelaOrcamentos');
  const paginacao = document.getElementById('paginacao');

  if (!tabela || !paginacao) return;

  let filtrosAtuais = {};

  let orcamentos = [];
  let paginaAtual = 1;
  const porPagina = 20;
  let totalPaginas = 1;

  function formatarData(dataISO) {
    if (!dataISO) return '';

    const data = new Date(dataISO);
    if (isNaN(data)) return '';

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
  }


  function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(valor);
}


  function renderizarTabela() {
    tabela.innerHTML = '';

    orcamentos.forEach(orc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${orc.id}</td>
        <td>${orc.cliente_nome}</td>
        <td>${orc.cliente_cnpj}</td>
        <td>${formatarData(orc.data)}</td>
        <td>${formatarMoeda(orc.total || 0)}</td>
        <td>
          <button onclick="verOrcamento(${orc.id})"><span class="material-icons">visibility</span></button>
          <button onclick="editarOrcamento(${orc.id})"><span class="material-icons">edit</span></button>
          <button onclick="excluirOrcamento(${orc.id})"><span class="material-icons">delete</span></button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  }

  function renderizarPaginacao() {
    paginacao.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === paginaAtual ? 'pagina ativa' : 'pagina';
      btn.onclick = () => {
        paginaAtual = i;
        carregarOrcamentos();
      };
      paginacao.appendChild(btn);
    }
  }

  async function carregarOrcamentos() {
    const filtros = {
      pagina: paginaAtual,
      limite: porPagina,
      ...filtrosAtuais
    };

    const { ok, orcamentos: dados, total } = await window.api.buscarOrcamentos(filtros);

    if (!ok) {
      alert('Erro ao carregar orçamentos');
      return;
    }

    for (const orc of dados) {
      const resposta = await window.api.buscarOrcamentoCompleto(orc.id);
      orc.total = resposta?.itens?.reduce((acc, item) => acc + item.valor_total, 0) || 0;
    }

    orcamentos = dados;
    totalPaginas = Math.ceil(total / porPagina);
    renderizarTabela();
    renderizarPaginacao();
  }

  carregarOrcamentos();

  window.verOrcamento = (id) => {
    window.orcamentoVisualizacaoId = id;
    window.orcamentoEditId = null;
    window.carregarPagina('orçamento/orçamento.html');
  };

  window.editarOrcamento = (id) => {
    window.orcamentoEditId = id;
    window.orcamentoVisualizacaoId = null;
    window.carregarPagina('orçamento/orçamento.html');
  };

  window.excluirOrcamento = (id) => {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Essa ação removerá o orçamento permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        window.api.excluirOrcamento(id).then(res => {
          if (res.ok) {
            Swal.fire('Excluído!', 'Orçamento removido com sucesso.', 'success');
            carregarOrcamentos();
          } else {
            Swal.fire('Erro', 'Não foi possível excluir o orçamento.', 'error');
          }
        });
      }
    });
  };

  document.getElementById('btnAplicarFiltro').addEventListener('click', () => {
    filtrosAtuais = {
      cliente: document.getElementById('filtroCliente').value,
      data: document.getElementById('filtroData').value
    };
    paginaAtual = 1;
    carregarOrcamentos();
  });

  document.getElementById('btnLimparFiltro').addEventListener('click', () => {
    filtrosAtuais = {};
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroData').value = '';
    paginaAtual = 1;
    carregarOrcamentos();
  });

  document.querySelector('.filter').addEventListener('click', () => {
    const filtros = document.getElementById('filtrosContainer');
    filtros.style.display = filtros.style.display === 'none' ? 'block' : 'none';
  });
})();
