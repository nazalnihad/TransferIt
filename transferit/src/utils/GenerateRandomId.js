
const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  };

export  const GenerateRandomId = () => {
    return generateRandomId();
  };