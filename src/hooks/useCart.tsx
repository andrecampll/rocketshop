import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@Rocketshoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`/stock/${productId}`)
      const stock = response.data;

      const products = [...cart];
      
      const foundProduct = products.find((product) => product.id === productId);
      
      if (foundProduct) {
        if (foundProduct.amount < stock.amount) {
          foundProduct.amount++;

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
          setCart(products)
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const response = await api.get<Product>(`/products/${productId}`);
        
        const product = response.data;
        
        if (stock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          product.amount = 1;
          
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
          setCart([...cart, product])
        }
      }
    } catch {  
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const products = [...cart];
      
      const productIndex = products.findIndex((product) => product.id === productId);
      
      if (productIndex > -1) {
        products.splice(productIndex, 1);
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(products))
        setCart(products)
        
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {  
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      
      const products = [...cart];
      
      const product = products.find((product) => product.id === productId);

      if (product) {
        const response = await api.get<Stock>(`/stock/${productId}`)
        
        const stock = response.data;

        if (amount <= stock.amount) {
          product.amount = amount;
          
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          setCart(products)
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
