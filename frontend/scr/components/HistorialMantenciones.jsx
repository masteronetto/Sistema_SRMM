import React, { useState, useEffect } from 'react';

export default function HistorialMantenciones({ maquinaId = null }) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [order, setOrder] = useState('desc');
    const [loading, setLoading] = useState(false);

    // filtros globales
    const [q, setQ] = useState('');
    const [fechaFrom, setFechaFrom] = useState('');
    const [fechaTo, setFechaTo] = useState('');
    const [idUsuario, setIdUsuario] = useState('');

    useEffect(() => {
        fetchPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage, order, maquinaId]);

    const fetchPage = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('srmm_token') || '';
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

            let url;
            if (q.trim() !== '' || fechaFrom || fechaTo || idUsuario) {
                // usar endpoint de búsqueda global
                const params = new URLSearchParams();
                if (q) params.append('q', q);
                if (fechaFrom) params.append('fecha_from', fechaFrom);
                if (fechaTo) params.append('fecha_to', fechaTo);
                if (idUsuario) params.append('id_usuario', idUsuario);
                params.append('page', page);
                params.append('per_page', perPage);
                url = `/api/historial_uso/search?${params.toString()}`;
            } else if (maquinaId) {
                const params = new URLSearchParams({ page, per_page: perPage, order });
                url = `/api/historial_uso/maquina/${maquinaId}?${params.toString()}`;
            } else {
                // sin máquina ni query, no mostrar nada
                setRows([]);
                setTotal(0);
                setLoading(false);
                return;
            }

            const res = await fetch(url, { headers });
            if (!res.ok) {
                console.error('Error cargando historial', res.status);
                setRows([]);
                setTotal(0);
                setLoading(false);
                return;
            }
            const payload = await res.json();
            setRows(payload.data || payload);
            setTotal(payload.total || (payload.length || 0));
        } catch (error) {
            console.error('Error fetch historial', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPage();
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return (
        <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Historial de Horómetro y Mantenciones</h3>

            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar máquina o descripción" className="p-2 border rounded" />
                <input type="date" value={fechaFrom} onChange={(e) => setFechaFrom(e.target.value)} className="p-2 border rounded" />
                <input type="date" value={fechaTo} onChange={(e) => setFechaTo(e.target.value)} className="p-2 border rounded" />
                <div className="flex gap-2">
                    <input value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} placeholder="ID mecánico" className="p-2 border rounded flex-1" />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Buscar</button>
                </div>
            </form>

            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <label>Orden:</label>
                    <select value={order} onChange={(e) => setOrder(e.target.value)} className="p-2 border rounded">
                        <option value="desc">Más reciente primero</option>
                        <option value="asc">Más antiguo primero</option>
                    </select>
                    <label>Registros por página:</label>
                    <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="p-2 border rounded">
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="text-sm text-slate-500">Total: {total}</div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase">
                            <th className="pb-3 px-2">Fecha</th>
                            <th className="pb-3 px-2">Máquina</th>
                            <th className="pb-3 px-2">Horómetro</th>
                            <th className="pb-3 px-2">Usuario</th>
                            <th className="pb-3 px-2">Arriendo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="py-4 text-center">Cargando...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan="5" className="py-4 text-center text-slate-500">No hay registros</td></tr>
                        ) : (
                            rows.map(r => (
                                <tr key={r.id_registro} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="py-3 px-2">{new Date(r.fecha_registro).toLocaleDateString('es-CL')}</td>
                                    <td className="py-3 px-2">{r.modelo_equipo || r.maquinaria_id_maquina}</td>
                                    <td className="py-3 px-2">{r.valor_horas} hrs</td>
                                    <td className="py-3 px-2">{r.id_usuario}</td>
                                    <td className="py-3 px-2">{r.arriendos_id_contrato || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded mr-2">Anterior</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded">Siguiente</button>
                </div>
                <div className="text-sm text-slate-500">Página {page} de {totalPages}</div>
            </div>
        </div>
    );
}
