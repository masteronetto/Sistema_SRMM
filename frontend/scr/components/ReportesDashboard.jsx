import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

function getAuthHeaders() {
    const token = localStorage.getItem('srmm_token') || '';
    return { 'Authorization': `Bearer ${token}` };
}

function formatCurrency(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return '0';
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    }).format(numeric);
}

function formatNumber(value, suffix = '') {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return `0${suffix}`;
    return `${numeric.toLocaleString('es-CL')}${suffix}`;
}

function getUserRole() {
    try {
        const token = localStorage.getItem('srmm_token') || '';
        if (!token || !token.includes('.')) return '';
        const payload = token.split('.')[1];
        const parsed = JSON.parse(atob(payload));
        return parsed.rol_acceso || '';
    } catch (error) {
        console.error('Error leyendo rol de usuario', error);
        return '';
    }
}

export default function ReportesDashboard() {
    const [topMaquinas, setTopMaquinas] = useState([]);
    const [estadisticas, setEstadisticas] = useState([]);
    const [ingresosDetalle, setIngresosDetalle] = useState([]);
    const [ingresosTotal, setIngresosTotal] = useState(0);
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState('');
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
    const [fechaFinFiltro, setFechaFinFiltro] = useState('');
    const [ingresosPage, setIngresosPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [currentRole, setCurrentRole] = useState('');

    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const ingresosPerPage = 5;

    const loadIngresosReport = async (headers, start, end) => {
        const params = new URLSearchParams();
        if (start) params.append('fecha_inicio', start);
        if (end) params.append('fecha_fin', end);

        const response = await fetch(`/api/reportes/ingresos?${params.toString()}`, { headers });
        if (!response.ok) {
            throw new Error('No se pudieron cargar los ingresos');
        }

        const payload = await response.json();
        setIngresosDetalle(Array.isArray(payload.by_maquina) ? payload.by_maquina : []);
        setIngresosTotal(Number(payload.total_ingresos || 0));
        setIngresosPage(1);
    };

    const loadDatos = async () => {
        setLoading(true);
        setStatusMessage('');
        try {
            const headers = getAuthHeaders();
            setCurrentRole(getUserRole());

            const [resTop, resStats] = await Promise.all([
                fetch('/api/reportes/top-maquinas', { headers }),
                fetch('/api/reportes/estadisticas', { headers })
            ]);

            if (resTop.ok) setTopMaquinas(await resTop.json());
            if (resStats.ok) setEstadisticas(await resStats.json());

            const today = new Date();
            const end = today.toISOString().slice(0, 10);
            const past = new Date(today);
            past.setDate(past.getDate() - 30);
            const start = past.toISOString().slice(0, 10);
            setFechaInicioFiltro(start);
            setFechaFinFiltro(end);
            await loadIngresosReport(headers, start, end);
        } catch (error) {
            console.error('Error cargando reportes:', error);
            setStatusMessage('Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDatos();
    }, []);

    useEffect(() => {
        if (!maquinaSeleccionada) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
            return undefined;
        }

        const fetchGrafico = async () => {
            try {
                const headers = getAuthHeaders();
                const response = await fetch(`/api/reportes/uso-historico/${maquinaSeleccionada}`, { headers });
                if (!response.ok) return;

                const datosUso = await response.json();

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const ctx = chartRef.current?.getContext('2d');
                if (!ctx) return;

                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: datosUso.map((dato) => new Date(dato.fecha_registro).toLocaleDateString('es-CL', { timeZone: 'UTC' })),
                        datasets: [{
                            label: 'Horas acumuladas',
                            data: datosUso.map((dato) => Number(dato.valor_horas) || 0),
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#4f46e5',
                            pointRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            } catch (error) {
                console.error('Error cargando gráfico:', error);
            }
        };

        fetchGrafico();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [maquinaSeleccionada]);

    const downloadIngresosCsv = async () => {
        try {
            const params = new URLSearchParams();
            if (fechaInicioFiltro) params.append('fecha_inicio', fechaInicioFiltro);
            if (fechaFinFiltro) params.append('fecha_fin', fechaFinFiltro);

            const response = await fetch(`/api/reportes/ingresos/csv?${params.toString()}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('No se pudo descargar el CSV');
            }

            const blob = await response.blob();
            const disposition = response.headers.get('content-disposition') || '';
            const filenameMatch = disposition.match(/filename="?(.*)"?/);
            const filename = filenameMatch ? filenameMatch[1] : 'ingresos.csv';

            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error descargando CSV de ingresos:', error);
            setStatusMessage('Error descargando CSV de ingresos');
        }
    };

    const ingresosTotalPages = Math.max(1, Math.ceil(ingresosDetalle.length / ingresosPerPage));
    const ingresosStartIndex = (ingresosPage - 1) * ingresosPerPage;
    const ingresosPageRows = ingresosDetalle.slice(ingresosStartIndex, ingresosStartIndex + ingresosPerPage);
    const isAdmin = currentRole === 'Administrador';

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Analítica y Optimización</h2>
                    <p className="text-sm text-slate-500 mt-1">Vista compartida. Los mecánicos pueden consultar, el administrador además puede editar maquinaria desde su vista dedicada.</p>
                </div>
                <div className="text-sm text-slate-500">
                    Rol actual: <span className="font-semibold text-slate-700">{currentRole || 'No detectado'}</span>
                </div>
            </div>

            {statusMessage ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm font-medium">
                    {statusMessage}
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Máquinas más utilizadas</h3>
                    <div className="overflow-x-auto max-h-80">
                        <table className="w-full min-w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase">
                                    <th className="pb-3 px-2">Modelo</th>
                                    <th className="pb-3 px-2 text-right">Horómetro Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topMaquinas.length === 0 ? (
                                    <tr><td colSpan="2" className="py-4 text-center text-slate-500">{loading ? 'Cargando...' : 'Sin datos'}</td></tr>
                                ) : (
                                    topMaquinas.map((machine) => (
                                        <tr key={machine.id_maquina} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                            <td className="py-3 px-2 font-semibold text-slate-700">{machine.modelo_equipo}</td>
                                            <td className="py-3 px-2 text-right">{formatNumber(machine.horometro_actual, ' hrs')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Evolución de uso en el tiempo</h3>
                    <select
                        value={maquinaSeleccionada}
                        onChange={(e) => setMaquinaSeleccionada(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg mb-4 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Seleccione una máquina para graficar...</option>
                        {topMaquinas.map((machine) => (
                            <option key={machine.id_maquina} value={machine.id_maquina}>{machine.modelo_equipo}</option>
                        ))}
                    </select>
                    <div className="relative h-80 w-full min-h-[260px]">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Correlación: Fallas vs Mantenciones preventivas</h3>
                <p className="text-sm text-slate-500 mb-6">Análisis de efectividad verificando el promedio de horas trabajadas entre cada mantención.</p>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full min-w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase">
                                <th className="pb-3 px-2">Máquina</th>
                                <th className="pb-3 px-2 text-center">Horas Totales</th>
                                <th className="pb-3 px-2 text-center">Mantenciones</th>
                                <th className="pb-3 px-2 text-center">Promedio Hrs/Mantención</th>
                                <th className="pb-3 px-2 text-center">Fallas Registradas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estadisticas.length === 0 ? (
                                <tr><td colSpan="5" className="py-4 text-center text-slate-500">{loading ? 'Cargando estadísticas...' : 'Sin datos'}</td></tr>
                            ) : (
                                estadisticas.map((item) => (
                                    <tr key={item.id_maquina} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="py-3 px-2 font-semibold text-slate-700">{item.modelo_equipo}</td>
                                        <td className="py-3 px-2 text-center">{item.horometro_actual} hrs</td>
                                        <td className="py-3 px-2 text-center">{item.total_mantenciones}</td>
                                        <td className="py-3 px-2 text-center font-bold text-indigo-600">{item.promedio_horas_entre_mantenciones} hrs</td>
                                        <td className={`py-3 px-2 text-center font-bold ${Number(item.total_fallas) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {item.total_fallas}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Detalle de ingresos por máquina</h3>
                        <p className="text-sm text-slate-500">Resultados paginados para el rango seleccionado de fechas.</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-sm text-slate-500">
                            {ingresosDetalle.length} máquina(s) · Página {ingresosPage} de {ingresosTotalPages}
                        </div>
                        <button onClick={downloadIngresosCsv} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
                            Descargar CSV
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-96">
                    <table className="w-full min-w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase">
                                <th className="pb-3 px-2">Máquina</th>
                                <th className="pb-3 px-2 text-center">Contratos</th>
                                <th className="pb-3 px-2 text-center">Días arrendados</th>
                                <th className="pb-3 px-2 text-center">Tarifa usada</th>
                                <th className="pb-3 px-2 text-right">Ingresos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingresosPageRows.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-4 text-center text-slate-500">No hay ingresos para el rango seleccionado.</td>
                                </tr>
                            ) : (
                                ingresosPageRows.map((row) => (
                                    <tr key={row.id_maquina} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="py-3 px-2 font-semibold text-slate-700">{row.modelo_equipo}</td>
                                        <td className="py-3 px-2 text-center">{row.contratos}</td>
                                        <td className="py-3 px-2 text-center">{row.dias_arrendados}</td>
                                        <td className="py-3 px-2 text-center">{formatCurrency(row.tarifa_usada || 0)}</td>
                                        <td className="py-3 px-2 text-right font-bold text-indigo-600">{formatCurrency(row.ingresos || 0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-slate-500">Los administradores además pueden modificar tarifas en la vista dedicada de maquinaria.</div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50"
                            onClick={() => setIngresosPage((prev) => Math.max(1, prev - 1))}
                            disabled={ingresosPage <= 1}
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50"
                            onClick={() => setIngresosPage((prev) => Math.min(ingresosTotalPages, prev + 1))}
                            disabled={ingresosPage >= ingresosTotalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {isAdmin ? null : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Tu rol actual no permite editar tarifas desde esta vista. La consulta y descarga de reportes permanece habilitada.
                </div>
            )}
        </div>
    );
}
