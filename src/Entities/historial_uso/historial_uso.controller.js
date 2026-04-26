const historialUsoRepo = require('./historial_uso.repository');
const maquinariaRepo = require('../maquinaria/maquinaria.repository');
const pool = require('../../db/pool');

function toPositiveNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function validateCreatePayload(payload) {
  const maquinaria_id_maquina = toPositiveNumber(payload.maquinaria_id_maquina);
  const valor_horas = toPositiveNumber(payload.valor_horas);
  const id_usuario = toPositiveNumber(payload.id_usuario);
  const arriendosRaw = payload.arriendos_id_contrato;
  const arriendos_id_contrato = arriendosRaw === undefined || arriendosRaw === null || arriendosRaw === ''
    ? null
    : toPositiveNumber(arriendosRaw);

  if (maquinaria_id_maquina === null || valor_horas === null || id_usuario === null) {
    return {
      error: 'Campos obligatorios y numericos: maquinaria_id_maquina, valor_horas, id_usuario',
      parsed: null
    };
  }

  if (arriendosRaw !== undefined && arriendosRaw !== null && arriendosRaw !== '' && arriendos_id_contrato === null) {
    return {
      error: 'arriendos_id_contrato debe ser numerico si se envia',
      parsed: null
    };
  }

  return {
    error: null,
    parsed: {
      maquinaria_id_maquina,
      valor_horas,
      id_usuario,
      fecha_registro: payload.fecha_registro || null,
      arriendos_id_contrato
    }
  };
}

async function create(req, res, next) {
  try {
    const { error, parsed } = validateCreatePayload(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const maquinaria = await maquinariaRepo.getMaquinariaById(parsed.maquinaria_id_maquina);
    if (!maquinaria) {
      return res.status(404).json({ message: 'Maquinaria no encontrada' });
    }

    if (Number(parsed.valor_horas) < Number(maquinaria.horometro_actual)) {
      return res.status(400).json({
        message: 'El valor_horas no puede ser menor al ultimo registro de la maquina'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertResult = await client.query(
        `
          INSERT INTO historial_horometro (maquinaria_id_maquina, valor_horas, id_usuario, fecha_registro, arriendos_id_contrato)
          VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
          RETURNING id_registro, valor_horas, fecha_registro, maquinaria_id_maquina, arriendos_id_contrato, id_usuario, created_at
        `,
        [
          parsed.maquinaria_id_maquina,
          parsed.valor_horas,
          parsed.id_usuario,
          parsed.fecha_registro,
          parsed.arriendos_id_contrato
        ]
      );

      const updatedMaquinaria = await client.query(
        `
          UPDATE maquinaria
          SET horometro_actual = $2,
              updated_at = NOW()
          WHERE id_maquina = $1
          RETURNING id_maquina
        `,
        [parsed.maquinaria_id_maquina, parsed.valor_horas]
      );

      if (updatedMaquinaria.rowCount === 0) {
        throw new Error('No fue posible actualizar la maquinaria');
      }

      await client.query('COMMIT');
      return res.status(201).json(insertResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ message: 'id_usuario no existe en usuarios' });
    }
    return next(error);
  }
}

async function listByMaquina(req, res, next) {
  try {
    const maquinaria_id_maquina = toPositiveNumber(req.params.maquinaria_id_maquina);
    if (maquinaria_id_maquina === null) {
      return res.status(400).json({ message: 'maquinaria_id_maquina debe ser numerico y mayor o igual a 0' });
    }

    const data = await historialUsoRepo.listHistorialByMaquina(maquinaria_id_maquina);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  listByMaquina
};
