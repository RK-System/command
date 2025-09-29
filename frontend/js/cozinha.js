document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verifica se existe um token
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '../pages/login_adm.html';
    return;
  }

  try {
    // 2. Verifica se o token é válido fazendo uma requisição
    const response = await fetch('/api/auth', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 3. Se a resposta não for ok, redireciona
    if (!response.ok) {
      throw new Error('Não autorizado');
    }

    // 4. Verifica o tipo de usuário
    const userData = await response.json();
    if (userData.userType !== 4) {
      // Tipo 4 = Cozinha
      window.location.href = '../pages/login_adm.html';
      return;
    }
  } catch (error) {
    // 5. Em caso de erro, redireciona
    console.error('Erro de autenticação:', error);
    window.location.href = '../pages/login_adm.html';
  }
});

// Variáveis globais
let pedidosEmPreparo = [];
let pedidosProntos = [];
let maiorPedidoIdConhecido = 0;
let toast = document.getElementById('toast');
let primeiraCarga = true;
let pedidosNovos = new Set();

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
  buscarPedidos();
  setInterval(buscarPedidos, 5000);
});

// Busca os pedidos do servidor
async function buscarPedidos() {
  try {
    const response = await fetch('/api/pedidos/active');
    if (!response.ok) {
      throw new Error('Erro ao buscar pedidos');
    }
    const todosPedidos = await response.json();

    // Filtro no frontend - apenas status 1 e 2
    const pedidos = todosPedidos.filter(
      (p) => p.ped_status === 1 || p.ped_status === 2
    );

    // Buscar informações adicionais de comanda para cada pedido
    await Promise.all(
      pedidos.map(async (pedido) => {
        try {
          const comandaResponse = await fetch(`/api/comandas/${pedido.com_id}`);
          if (comandaResponse.ok) {
            const comanda = await comandaResponse.json();
            pedido.mesa_id = comanda.mes_id;
            pedido.comanda_id = comanda.com_id;
          }
        } catch (error) {
          console.error(
            `Erro ao buscar comanda do pedido ${pedido.ped_id}:`,
            error
          );
        }
      })
    );

    // Encontrar o maior ID atual
    const maxIdAtual =
      pedidos.length > 0 ? Math.max(...pedidos.map((p) => p.ped_id)) : 0;

    // Identificar novos pedidos
    if (!primeiraCarga) {
      pedidos.forEach((pedido) => {
        if (pedido.ped_id > maiorPedidoIdConhecido) {
          pedidosNovos.add(pedido.ped_id);
        }
      });
    }

    // Atualizar maior ID conhecido
    maiorPedidoIdConhecido = maxIdAtual;

    // Separar em preparo (1) e prontos (2)
    const novosEmPreparo = pedidos.filter((p) => p.ped_status === 1);
    const novosProntos = pedidos.filter((p) => p.ped_status === 2);

    // Buscar produtos para cada pedido
    await Promise.all([
      ...novosEmPreparo.map((pedido) => buscarProdutosPedido(pedido)),
      ...novosProntos.map((pedido) => buscarProdutosPedido(pedido)),
    ]);

    pedidosEmPreparo = novosEmPreparo;
    pedidosProntos = novosProntos;

    renderizarPedidos();
    primeiraCarga = false;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    showToast('Erro ao buscar pedidos', 'error');
  }
}

// Busca os produtos de um pedido
async function buscarProdutosPedido(pedido) {
  try {
    const response = await fetch(
      `/api/pedidos-produtos/pedido/${pedido.ped_id}`
    );
    if (!response.ok) {
      throw new Error(`Erro ao buscar produtos do pedido ${pedido.ped_id}`);
    }
    pedido.pedido_produtos = await response.json();
  } catch (error) {
    console.error(`Erro ao buscar produtos do pedido ${pedido.ped_id}:`, error);
    pedido.pedido_produtos = [];
  }
}

// Atualiza o status de um pedido
async function atualizarStatusPedido(pedidoId, novoStatus) {
  try {
    const response = await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ped_status: novoStatus }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar pedido');
    }

    // Remove o pedido da lista de novos quando for atualizado
    pedidosNovos.delete(pedidoId);

    showToast(
      novoStatus === 2
        ? 'Pedido marcado como pronto!'
        : 'Pedido marcado como entregue!',
      'success'
    );

    await buscarPedidos();
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    showToast('Erro ao atualizar pedido', 'error');
  }
}

// Renderiza todos os pedidos
function renderizarPedidos() {
  renderizarListaPedidos('pedidos-em-preparo', pedidosEmPreparo, true);
  renderizarListaPedidos('pedidos-prontos', pedidosProntos, false);

  // Atualiza contadores
  document.getElementById('contador-em-preparo').textContent =
    `(${pedidosEmPreparo.length})`;
  document.getElementById('contador-prontos').textContent =
    `(${pedidosProntos.length})`;
}

// Renderiza uma lista específica de pedidos
function renderizarListaPedidos(containerId, pedidos, emPreparo) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  pedidos.forEach((pedido) => {
    const card = document.createElement('div');
    card.className = `pedido-card ${emPreparo ? 'em-preparo' : 'pronto'}`;

    const dataPedido = new Date(pedido.ped_created_at);
    const dataHora = dataPedido.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const pedidoNovo = pedidosNovos.has(pedido.ped_id);

    card.innerHTML = `
    <div class="pedido-header">
      <div class="pedido-info">
        <span class="pedido-id">Pedido #${pedido.ped_id}</span>
        <span class="mesa">Mesa #${pedido.mesa_id || 'N/A'}</span>
        <span class="comanda">Comanda #${pedido.comanda_id || 'N/A'}</span>
      </div>
      <span class="pedido-hora">
        ${dataHora}
        ${pedidoNovo ? '<span class="indicador-novo">Novo</span>' : ''}
      </span>
    </div>
    <div class="pedido-itens">
      ${(pedido.pedido_produtos || [])
        .map(
          (item) => `
        <div class="pedido-item">
          <span><span class="quantidade">${item.ppr_quantidade}x</span> ${item.pro_nome || `Produto ${item.pro_id}`}</span>
        </div>
        `
        )
        .join('')}
    </div>
    <button class="${emPreparo ? 'btn-pronto' : 'btn-entregue'}" 
            data-id="${pedido.ped_id}">
      ${emPreparo ? 'Marcar como Pronto' : 'Marcar como Entregue'}
    </button>
    `;

    // Adiciona evento de clique
    card.querySelector('button').addEventListener('click', () => {
      atualizarStatusPedido(pedido.ped_id, emPreparo ? 2 : 3);
    });

    container.appendChild(card);
  });
}

// Mostra notificação
function showToast(message, type) {
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.className = `toast toast-${type} show`;
  toast.querySelector('.fas').className = `fas ${icon}`;
  toast.querySelector('.message').textContent = message;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
