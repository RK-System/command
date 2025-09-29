const mesasRepository = require('../repositories/mesaRepository');
const path = require('path');
const fs = require('fs');

const mesasController = {
  list: async (req, res) => {
    try {
      const mesas = await mesasRepository.getAll();
      res.json(mesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar mesas.' });
    }
  },

  listInativas: async (req, res) => {
    try {
      const mesas = await mesasRepository.getInativas();
      res.json(mesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar mesas.' });
    }
  },

  get: async (req, res) => {
    try {
      const mesa = await mesasRepository.getById(req.params.id);
      if (mesa) {
        res.json(mesa);
      } else {
        res.status(404).json({ error: 'Mesa não encontrado.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar mesa.' });
    }
  },

  getLocaisRestritos: async (req, res) => {
    try {
      const locais = await mesasRepository.getLocaisRestritos();
      res.json(locais);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar os locais.' });
    }
  },

  getTodosLocais: async (req, res) => {
    try {
      const locais = await mesasRepository.getTodosLocais();
      res.json(locais);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar os locais.' });
    }
  },

  create: async (req, res) => {
    try {
      const { nome, codigo, status, capacidade, descricao, local } = req.body;

      if (
        !capacidade ||
        !descricao ||
        isNaN(local) ||
        !nome ||
        !codigo ||
        isNaN(status) ||
        status < 0
      ) {
        return res
          .status(400)
          .json({ error: 'Todos os campos são obrigatórios.' });
      }

      const novaMesa = await mesasRepository.create({
        nome,
        codigo,
        status,
        capacidade,
        descricao,
        local,
      });

      res.status(201).json(novaMesa);
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      res.status(500).json({ error: 'Erro ao criar mesa.' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { codigo, capacidade, descricao, local, status } = req.body;

      const mesaExistente = await mesasRepository.getByIdIgnoreStatus(id);
      if (!mesaExistente) {
        return res.status(404).json({ error: 'Mesa não encontrada.' });
      }

      // Remove a validação que pode estar bloqueando
      const novoStatus = status ?? mes_status;

      if (novoStatus === 0) {
        await mesasRepository.setMesaLogado(id, false);
      }
      const mesaAtualizada = await mesasRepository.update(id, {
        codigo: codigo || mesaExistente.mes_codigo,
        capacidade: capacidade || mesaExistente.mes_capacidade,
        descricao: descricao || mesaExistente.mes_descricao,
        local: local || mesaExistente.mes_local,
        status:
          novoStatus !== undefined ? novoStatus : mesaExistente.mes_status,
      });

      res.status(200).json(mesaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error);
      res.status(500).json({ error: 'Erro ao atualizar mesa.' });
    }
  },

  delete: async (req, res) => {
    try {
      const mesaAtualizada = await mesasRepository.delete(req.params.id);

      if (mesaAtualizada) {
        res.status(200).json({
          message: 'Mesa desativado com sucesso.',
          mesa: mesaAtualizada,
        });
      } else {
        res.status(404).json({ error: 'Mesa não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao desativar mesa:', error);
      res.status(500).json({ error: 'Erro ao desativar mesa.' });
    }
  },

  getByLocal: async (req, res) => {
    try {
      const { local } = req.params;
      const mesas = await mesasRepository.getByLocal(local);

      if (mesas.length > 0) {
        res.status(200).json(mesas);
      } else {
        res.status(404).json({
          error: 'Nenhuma mesa encontrada para o local especificado.',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar mesas por local:', error);
      res.status(500).json({ error: 'Erro ao buscar mesas por local.' });
    }
  },

  getLocalById: async (req, res) => {
    try {
      const { id } = req.params;
      const descricao = await mesasRepository.getLocalById(id);

      if (descricao) {
        res.status(200).json(descricao);
      } else {
        res
          .status(404)
          .json({ error: 'Nenhum local encontrado para esse ID.' });
      }
    } catch (error) {
      console.error('Erro ao buscar local por ID:', error);
      res.status(500).json({ error: 'Erro ao buscar local por ID.' });
    }
  },

  getPesquisaArea: async (req, res) => {
    try {
      const { mes_id, mes_descricao, loc_descricao } = req.query;

      // Chama o repositório passando os parâmetros
      const mesas = await mesasRepository.getPesquisaArea(
        mes_id,
        mes_descricao,
        loc_descricao
      );
      res.json(mesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar mesas.' });
    }
  },

  getPesquisaAtivas: async (req, res) => {
    try {
      const { mes_id, mes_descricao } = req.query;
      const mesas = await mesasRepository.getPesquisaAtivas(
        mes_id,
        mes_descricao
      );
      res.json(mesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar mesas.' });
    }
  },

  getPesquisaInativas: async (req, res) => {
    try {
      const { mes_id, mes_descricao } = req.query;
      const mesas = await mesasRepository.getPesquisaInativas(
        mes_id,
        mes_descricao
      );
      res.json(mesas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar mesas.' });
    }
  },

  getByCode: async (req, res) => {
    try {
      const { codigo } = req.params;

      if (!codigo) {
        return res.status(400).json({ error: 'Código da mesa é obrigatório.' });
      }

      const mesa = await mesasRepository.getByCode(codigo);

      if (mesa) {
        res.status(200).json(mesa);
      } else {
        res.status(404).json({ error: 'Mesa não encontrada.' });
      }
    } catch (error) {
      console.error('Erro ao buscar mesa pelo código:', error);
      res.status(500).json({ error: 'Erro ao buscar mesa pelo código.' });
    }
  },

  setMesaLogado: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (typeof status !== 'boolean') {
        return res
          .status(400)
          .json({ error: 'Status deve ser um valor booleano.' });
      }

      const mesa = await mesasRepository.getById(id);
      if (!mesa) {
        return res.status(404).json({ error: 'Mesa não encontrada.' });
      }

      const mesaAtualizada = await mesasRepository.setMesaLogado(id, status);
      res.json(mesaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar status de login da mesa:', error);
      res
        .status(500)
        .json({ error: 'Erro ao atualizar status de login da mesa.' });
    }
  },
  getMesaLogado: async (req, res) => {
    try {
      const { id } = req.params;
      const mesaLogado = await mesasRepository.getMesaLogado(id);

      if (!mesaLogado) {
        return res.status(404).json({ error: 'Mesa não encontrada.' });
      }

      res.json(mesaLogado);
    } catch (error) {
      console.error('Erro ao verificar status de login da mesa:', error);
      res
        .status(500)
        .json({ error: 'Erro ao verificar status de login da mesa.' });
    }
  },
};

module.exports = mesasController;
