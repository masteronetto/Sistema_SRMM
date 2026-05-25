import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ReportesDashboard() {
    const [topMaquinas, setTopMaquinas] = useState([]);
    const [estadisticas, setEstadisticas] = useState([]);
    const [maquinaSeleccionada, setMaquinaSeleccionada] = useState('');
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Cargar datos iniciales (Subtareas B, C y D)
    useEffect(() => {
        const fetchDatosIniciales = async () => {
            try {
                const token = localStorage.getItem('srmm_token') || '';
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resTop, resStats] = await Promise.all([
                    fetch('/api/reportes/top-maquinas', { headers }),
                    fetch('/api/reportes/estadisticas', { headers })
                ]);

                if (resTop.ok) setTopMaquinas(await resTop.json());
                if (resStats.ok) setEstadisticas(await resStats.json());
            } catch (error) {
                console.error('Error cargando reportes:', error);
            }
        };
        fetchDatosIniciales();
    }, []);

    // Cargar y dibujar gráfico (Subtarea A)
    useEffect(() => {
        if (!maquinaSeleccionada) return;

        const fetchGrafico = async () => {
            try {
                const token = localStorage.getItem('srmm_token') || '';
                const res = await fetch(`/api/reportes/uso-historico/${maquinaSeleccionada}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) return;
                const datosUso = await res.json();

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const ctx = chartRef.current.getContext('2d');
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: datosUso.map(d => new Date(d.fecha_registro).toLocaleDateString('es-CL', { timeZone: 'UTC' })),
                        datasets: [{
                            label: 'Horas acumuladas',
                            data: datosUso.map(d => d.valor_horas),
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

        // Limpieza al desmontar el componente
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [maquinaSeleccionada]);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold text-slate-800 border-b pb-4">Analítica y Optimización (Sprint 4)</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subtarea D: Máquinas más utilizadas */}
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
                                <tr><td colSpan="2" className="py-4 text-center text-slate-500">Cargando...</td></tr>
                            ) : (
                                topMaquinas.map(m => (
                                    <tr key={m.id_maquina} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="py-3 px-2 font-semibold text-slate-700">{m.modelo_equipo}</td>
                                        <td className="py-3 px-2 text-right">{m.horometro_actual} hrs</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        </table>
                        </div>
                </div>

                {/* Subtarea A: Gráfico de evolución de uso */}
                <div className="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Evolución de uso en el tiempo</h3>
                    <select 
                        value={maquinaSeleccionada}
                        onChange={(e) => setMaquinaSeleccionada(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg mb-4 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Seleccione una máquina para graficar...</option>
                        {topMaquinas.map(m => (
                            <option key={m.id_maquina} value={m.id_maquina}>{m.modelo_equipo}</option>
                        ))}
                    </select>
                    <div className="relative h-80 w-full min-h-[260px]">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>
            </div>

            {/* Subtareas B y C: Correlación Fallas vs Mantenciones */}
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
                                <tr><td colSpan="5" className="py-4 text-center text-slate-500">Cargando estadísticas...</td></tr>
                            ) : (
                                estadisticas.map(e => (
                                    <tr key={e.id_maquina} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="py-3 px-2 font-semibold text-slate-700">{e.modelo_equipo}</td>
                                        <td className="py-3 px-2 text-center">{e.horometro_actual} hrs</td>
                                        <td className="py-3 px-2 text-center">{e.total_mantenciones}</td>
                                        <td className="py-3 px-2 text-center font-bold text-indigo-600">{e.promedio_horas_entre_mantenciones} hrs</td>
                                        <td className={`py-3 px-2 text-center font-bold ${e.total_fallas > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {e.total_fallas}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}