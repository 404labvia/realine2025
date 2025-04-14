import {
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement, 
  LineElement,
  ArcElement,
  RadialLinearScale
} from 'chart.js';

// Registriamo i componenti di Chart.js necessari
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  PointElement, 
  LineElement,
  ArcElement,
  RadialLinearScale
);