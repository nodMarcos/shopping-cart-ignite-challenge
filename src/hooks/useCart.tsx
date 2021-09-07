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
      // TODO
      const { data: productToAdd } = await api.get<Product | undefined>(`/products/${productId}`);
      const { data: remainingStock } = await api.get<Stock | undefined>(`/stock/${productId}`);

      if (remainingStock && productToAdd) {
        if (productToAdd.amount > remainingStock.amount) {
          toast.error('Quantidade solicitada fora de estoque')
        } else {
          const cartItem = cart.find(item => item.id === productToAdd.id);
          if (cartItem) {
            updateProductAmount({ productId: cartItem.id, amount: cartItem.amount + 1 });
          } else {
            productToAdd.amount = 1;

            setCart([...cart, productToAdd])

            localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, productToAdd]))
          }
        }
      }
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const productToRemove = [...cart].filter((product) => product.id !== productId)

      console.log(productToRemove);

      if(productToRemove.length !== cart.length){
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...productToRemove]));
        setCart([...productToRemove])
      }else{
        toast.error("Erro na remoção do produto")
      }
    } catch {
      // TODO
      toast.error("Erro na remoção do produto")
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const { data: remainingStock } = await api.get<Stock | undefined>(`/stock/${productId}`);
      if (remainingStock) {
        if (amount > remainingStock.amount || amount <= 0) {
          toast.error('Quantidade solicitada fora de estoque')
        } else {
          const oldCart = [...cart];
          const index = cart.findIndex((product) => product.id === productId);
          oldCart[index].amount = amount;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(oldCart))
          setCart(oldCart);
        }
      }
    } catch {
      // TODO
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
