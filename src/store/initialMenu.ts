import type { MenuItem } from '../types/menu';

export const initialMenu: MenuItem[] = [
    {
        id: 1,
        name: "Ceviche Clásico",
        description: "Pesca del día marinada en leche de tigre, con camote glaseado, choclo y canchita serrana.",
        price: 38.00,
        category: "Entradas",
        image: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?auto=format&fit=crop&w=800&q=80",
        available: true
    },
    {
        id: 2,
        name: "Lomo Saltado",
        description: "Trozos de lomo fino salteados al wok con cebolla, tomate y ají amarillo, servido con papas fritas y arroz.",
        price: 45.00,
        category: "Fondos",
        image: "images/lomosaltado.png",
        available: true
    },
    {
        id: 3,
        name: "Ají de Gallina",
        description: "Pechuga de gallina deshilachada en crema de ají amarillo, nueces y parmesano, con papa amarilla y arroz.",
        price: 32.00,
        category: "Fondos",
        image: "images/ajigallina.png",
        available: true
    },
    {
        id: 4,
        name: "Causa Limeña",
        description: "Suave masa de papa amarilla prensada con limón y ají amarillo, rellena de pollo, palta y mayonesa.",
        price: 24.00,
        category: "Entradas",
        image: "images/causa.png",
        available: true
    },
    {
        id: 5,
        name: "Chicha Morada",
        description: "Refrescante bebida de maíz morado, piña, manzana, canela y clavo de olor.",
        price: 12.00,
        category: "Bebidas",
        image: "images/chichamorada.png",
        available: true
    },
    {
        id: 6,
        name: "Suspiro a la Limeña",
        description: "Dulce de leche suave cubierto con merengue al oporto y canela.",
        price: 18.00,
        category: "Postres",
        image: "images/suspirolima.png",
        available: true
    }
];
