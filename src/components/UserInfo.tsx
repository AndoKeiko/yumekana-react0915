import { UserCircleIcon } from '@heroicons/react/20/solid';

const UserInfo = () => {
  return (
    <div className='userInfo'>
      {/* {auth.currentUser?.photoURL ? ( */}
        {/* <img src={auth.currentUser?.photoURL} alt='user photo' /> */}
      {/* ) : ( */}
        <UserCircleIcon className="h-16 w-16 text-white"/>
      {/* )} */}
      {/* <p>{auth.currentUser?.displayName}</p> */}
    </div>
  )
};

export default UserInfo;
