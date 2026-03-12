/**
 * 데이터 레이어 진입점
 * 
 * 식당 데이터와 레포지토리를 외부에 export
 */

// 데이터 소스
export { restaurantDB } from './restaurantData.js';

// 레포지토리
export { 
  RestaurantRepository, 
  restaurantRepository 
} from './repositories/RestaurantRepository.js';
