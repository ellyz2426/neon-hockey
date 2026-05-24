// Table themes for Neon Hockey VR

export interface TableTheme {
  name: string;
  surfaceColor: string;
  surfaceEmissive: string;
  railColor: string;
  railEmissive: string;
  accentColor: string;
  puckColor: string;
  envFogColor: string;
  envGridColor: string;
  envAccent1: string;
  envAccent2: string;
}

export const TableThemes: TableTheme[] = [
  {
    name: 'Neon Holodeck',
    surfaceColor: '#0a0a1a',
    surfaceEmissive: '#001122',
    railColor: '#1a1a3a',
    railEmissive: '#00aaff',
    accentColor: '#00ccff',
    puckColor: '#ff6600',
    envFogColor: '#000811',
    envGridColor: '#00ccff',
    envAccent1: '#00ffcc',
    envAccent2: '#0066ff',
  },
  {
    name: 'Crimson Arena',
    surfaceColor: '#1a0808',
    surfaceEmissive: '#220000',
    railColor: '#3a1a1a',
    railEmissive: '#ff3333',
    accentColor: '#ff4444',
    puckColor: '#ffaa00',
    envFogColor: '#0a0000',
    envGridColor: '#ff3333',
    envAccent1: '#ff6644',
    envAccent2: '#ff0033',
  },
  {
    name: 'Toxic Green',
    surfaceColor: '#081a08',
    surfaceEmissive: '#002200',
    railColor: '#1a3a1a',
    railEmissive: '#33ff33',
    accentColor: '#44ff44',
    puckColor: '#ff44ff',
    envFogColor: '#000a00',
    envGridColor: '#33ff33',
    envAccent1: '#66ff44',
    envAccent2: '#00ff66',
  },
  {
    name: 'Cyberpunk',
    surfaceColor: '#12061a',
    surfaceEmissive: '#110022',
    railColor: '#2a1a3a',
    railEmissive: '#cc44ff',
    accentColor: '#dd66ff',
    puckColor: '#00ffaa',
    envFogColor: '#060011',
    envGridColor: '#cc44ff',
    envAccent1: '#ff44cc',
    envAccent2: '#8844ff',
  },
  {
    name: 'Arctic Frost',
    surfaceColor: '#0a1218',
    surfaceEmissive: '#001133',
    railColor: '#1a2a3a',
    railEmissive: '#66ccff',
    accentColor: '#88ddff',
    puckColor: '#ffaa44',
    envFogColor: '#000611',
    envGridColor: '#66ccff',
    envAccent1: '#88eeff',
    envAccent2: '#4488ff',
  },
];
