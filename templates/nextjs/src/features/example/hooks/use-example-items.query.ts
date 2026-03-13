import { useQuery } from '@tanstack/react-query';
import { ExampleService } from '../api/example-service';

export const useExampleItems = () => {
  return useQuery({
    queryKey: ['example-items'],
    queryFn: () => ExampleService.getAll(),
  });
};
