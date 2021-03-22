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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');    

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get('/stock');
      const stocks = data as Stock[];

      const productStock = stocks.find(item => item.id === productId);      
      let cartItem = cart.find(item => item.id === productId);

      if (!cartItem) {
        const { data: responseProducts } = await api.get('/products');
        const productData = responseProducts.find(
          (item: Product) => item.id === productId
        );

        cartItem = { ...productData, amount: 0 };
      }

      if (productStock && cartItem) {
        const updateAmount = cartItem.amount+1;

        if (productStock.amount >= updateAmount) {
          cartItem.amount = updateAmount;

          let updatedCartList = cart.filter(item => item.id !== productId);         

          setCart([...updatedCartList, cartItem]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...updatedCartList, cartItem])); 
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }            
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(item => item.id !== productId);
      
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return;
    }

    try {
      const { data } = await api.get('/stock');
      const stocks = data as Stock[];

      const productStock = stocks.find(item => item.id === productId);      
      let cartItem = cart.find(item => item.id === productId);      

      if (productStock && cartItem) {
        const updateAmount = amount;

        if (productStock.amount >= updateAmount) {
          cartItem.amount = updateAmount;

          let updatedCartList = cart.filter(item => item.id !== productId);         

          setCart([...updatedCartList, cartItem]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...updatedCartList, cartItem])); 
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
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
