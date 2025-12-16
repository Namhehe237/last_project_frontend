import { TeacherOption } from './TeacherOption';

export interface ListTeacherResponse {
  content?: TeacherOption[];
  totalElements: number;
  totalPages: number;
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  number?: number;
  numberOfElements?: number;
  size?: number;
}

