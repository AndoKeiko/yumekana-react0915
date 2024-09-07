import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUserId, clearUserId } from '../store/userSlice';

export const useUser = () => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.userId);

  const setUserIdAction = (id: string) => dispatch(setUserId(id));
  const clearUserIdAction = () => dispatch(clearUserId());

  return { userId, setUserIdAction, clearUserIdAction };
};