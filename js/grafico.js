// Gráfico de linhas em canvas, usado pelos dois modos.
// series: [{ color, points: [{ date, value }], dashed? }]
window.Grafico = {
  render(series, canvas) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    const width = rect.width, height = rect.height;
    const left = 48, right = 10, top = 10, bottom = 24;
    const chartWidth = width - left - right, chartHeight = height - top - bottom;
    const allValues = series.flatMap((item) => item.points.map((point) => point.value));
    const maxValue = Math.max(...allValues, 1), minValue = Math.min(...allValues, 0);
    const range = maxValue - minValue || 1;
    context.font = "10px Trebuchet MS, sans-serif";
    context.lineWidth = 1;
    for (let index = 0; index <= 3; index++) {
      const y = top + chartHeight * index / 3;
      const amount = maxValue - range * index / 3;
      context.strokeStyle = "#e5e8e1";
      context.beginPath(); context.moveTo(left, y); context.lineTo(width - right, y); context.stroke();
      context.fillStyle = "#758079";
      context.textAlign = "right";
      context.fillText(new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(amount) < 0.5 ? 0 : amount), left - 7, y + 3);
    }
    series.forEach((item) => {
      const points = item.points;
      if (!points.length) return;
      context.beginPath();
      const firstTime = points[0].date.getTime();
      const lastTime = points[points.length - 1].date.getTime();
      points.forEach((point, index) => {
        const x = left + (lastTime === firstTime ? chartWidth / 2 : chartWidth * (point.date.getTime() - firstTime) / (lastTime - firstTime));
        const y = top + (maxValue - point.value) / range * chartHeight;
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.setLineDash(item.dashed ? [5, 4] : []);
      context.strokeStyle = item.color; context.lineWidth = 2.3; context.stroke();
    });
    context.setLineDash([]);
  }
};
