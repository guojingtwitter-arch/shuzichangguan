import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownToLine,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Download,
  Landmark,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Store,
  TicketCheck,
  Wallet,
} from 'lucide-react';

import { cn } from './types';

type Period = 'today' | 'week' | 'month' | 'custom';
type StoreId =
  | 'all'
  | 'north'
  | 'river'
  | 'east'
  | 'softB'
  | 'softF'
  | 'huaqiao'
  | 'jiageng'
  | 'lvcuo'
  | 'dihao'
  | 'sibei'
  | 'xianglu'
  | 'wanda';
type Tab = 'project' | 'source' | 'payment' | 'store';
type DashboardType = 'venue' | 'simpleRevenue' | 'venueBooking' | 'courseTraining' | 'recognition' | 'orderStats' | 'fitness';
type Project = 'venue' | 'storedCard' | 'courseCard' | 'passCard' | 'goods';
type Source = 'miniProgram' | 'cashier' | 'meituan' | 'douyin';
type Payment = 'wechat' | 'payCode' | 'storedBalance' | 'offline' | 'corporate' | 'free' | 'meituanGroup' | 'douyinGroup';
type TimeGranularity = 1 | 2 | 3;
type MobileReport = 'home' | 'revenue' | 'venue' | 'course' | 'recognition';
type CustomDateRange = { start: string; end: string };
type VenueSubVenue = 'all' | 'badminton' | 'basketball' | 'pickleball';

type RevenueOrder = {
  id: string;
  store: Exclude<StoreId, 'all'>;
  project: Project;
  source: Source;
  payment: Payment;
  receivable: number;
  discount: number;
  paid: number;
  refund?: number;
  orders: number;
  dateBucket: 'today' | 'week' | 'month';
};

const stores = [
  { id: 'all', name: '全部门店' },
  { id: 'north', name: '湖滨旗舰馆' },
  { id: 'river', name: '江湾训练馆' },
  { id: 'east', name: '东城综合馆' },
] satisfies { id: StoreId; name: string }[];

const fitnessStores = [
  { id: 'all', name: '全部门店' },
  { id: 'softB', name: '加减健身（软三B区店）' },
  { id: 'softF', name: '加减健身（软三F区店）' },
  { id: 'huaqiao', name: '加减健身（华侨大学店）' },
  { id: 'jiageng', name: '加减健身（嘉庚体育馆店）' },
  { id: 'lvcuo', name: '加减健身（吕厝店）' },
  { id: 'dihao', name: '加减健身（帝豪店）' },
  { id: 'sibei', name: '加减健身（思北店）' },
  { id: 'xianglu', name: '加减健身（湖里翔鹭店）' },
  { id: 'wanda', name: '加减健身（湖里万达店）' },
] satisfies { id: StoreId; name: string }[];

const venueSubVenues = [
  { id: 'all', name: '全部子场馆', weight: 1 },
  { id: 'badminton', name: '羽毛球馆', weight: 0.54 },
  { id: 'basketball', name: '篮球馆', weight: 0.28 },
  { id: 'pickleball', name: '匹克球馆', weight: 0.18 },
] satisfies { id: VenueSubVenue; name: string; weight: number }[];

const venueAnalysisVenueOptions = [
  { id: 'badminton', name: '羽毛球馆' },
  { id: 'basketball', name: '篮球馆' },
] satisfies { id: VenueSubVenue; name: string }[];

const periods = [
  { id: 'today', name: '本日', range: '2026-06-03' },
  { id: 'week', name: '本周', range: '2026-06-01 至 2026-06-07' },
  { id: 'month', name: '本月', range: '2026-06-01 至 2026-06-30' },
  { id: 'custom', name: '自定义', range: '2026-05-24 至 2026-06-03' },
] satisfies { id: Period; name: string; range: string }[];

const projectMeta: Record<Project, { name: string; short: string; color: string; icon: typeof Store }> = {
  venue: { name: '场地预订', short: '场地', color: 'bg-cyan-500', icon: CalendarDays },
  storedCard: { name: '储值卡销售', short: '储值卡', color: 'bg-blue-500', icon: Wallet },
  courseCard: { name: '课程卡销售', short: '课程卡', color: 'bg-indigo-500', icon: TicketCheck },
  passCard: { name: '次卡 / 时间卡销售', short: '次卡时间卡', color: 'bg-amber-500', icon: CreditCard },
  goods: { name: '商品销售（含快捷收款）', short: '商品/快捷收款', color: 'bg-rose-500', icon: ShoppingBag },
};

const sourceMeta: Record<Source, { name: string; tag?: string; color: string }> = {
  miniProgram: { name: '小程序', color: 'bg-blue-500' },
  cashier: { name: '收银台', color: 'bg-sky-500' },
  meituan: { name: '美团核销', tag: '第三方团购', color: 'bg-yellow-500' },
  douyin: { name: '抖音核销', tag: '第三方团购', color: 'bg-fuchsia-500' },
};

const paymentMeta: Record<Payment, { name: string; settlement: 'platform' | 'merchant' | 'thirdParty' | 'nonCash'; note: string; icon: typeof Wallet }> = {
  wechat: { name: '小程序收款', settlement: 'platform', note: '可在商户后台核对入账', icon: Wallet },
  payCode: { name: '收银台下单（商户扫码+用户扫码）', settlement: 'platform', note: '可在商户后台核对入账', icon: ReceiptText },
  storedBalance: { name: '储值卡/余额支付', settlement: 'nonCash', note: '预收余额使用，不重复确认收入', icon: CreditCard },
  offline: { name: '线下付款', settlement: 'merchant', note: '使用收银台登记订单，资金由商户自行核对', icon: Store },
  corporate: { name: '对公转账', settlement: 'merchant', note: '使用收银台登记订单，资金由商户自行核对', icon: Landmark },
  free: { name: '无需支付', settlement: 'nonCash', note: '金额为 0，保留订单数', icon: CircleDollarSign },
  meituanGroup: { name: '美团核销', settlement: 'thirdParty', note: '需在美团平台核对结算与退款', icon: TicketCheck },
  douyinGroup: { name: '抖音核销', settlement: 'thirdParty', note: '需在抖音平台核对结算与退款', icon: TicketCheck },
};

const orders: RevenueOrder[] = [
  { id: 'R001', store: 'north', project: 'venue', source: 'miniProgram', payment: 'wechat', receivable: 16800, discount: 920, paid: 15880, refund: 360, orders: 79, dateBucket: 'today' },
  { id: 'R002', store: 'north', project: 'venue', source: 'cashier', payment: 'storedBalance', receivable: 8200, discount: 240, paid: 7960, orders: 31, dateBucket: 'today' },
  { id: 'R012', store: 'north', project: 'venue', source: 'cashier', payment: 'payCode', receivable: 6800, discount: 260, paid: 6540, refund: 180, orders: 22, dateBucket: 'today' },
  { id: 'R003', store: 'north', project: 'storedCard', source: 'cashier', payment: 'payCode', receivable: 24000, discount: 1600, paid: 22400, refund: 1000, orders: 18, dateBucket: 'today' },
  { id: 'R004', store: 'river', project: 'courseCard', source: 'miniProgram', payment: 'wechat', receivable: 18600, discount: 1200, paid: 17400, orders: 15, dateBucket: 'today' },
  { id: 'R005', store: 'river', project: 'passCard', source: 'cashier', payment: 'offline', receivable: 12800, discount: 560, paid: 12240, orders: 26, dateBucket: 'today' },
  { id: 'R006', store: 'east', project: 'goods', source: 'cashier', payment: 'payCode', receivable: 6200, discount: 180, paid: 6020, orders: 96, dateBucket: 'today' },
  { id: 'R007', store: 'east', project: 'goods', source: 'cashier', payment: 'offline', receivable: 2380, discount: 0, paid: 2380, orders: 34, dateBucket: 'today' },
  { id: 'R008', store: 'north', project: 'passCard', source: 'meituan', payment: 'meituanGroup', receivable: 9400, discount: 700, paid: 8700, refund: 240, orders: 44, dateBucket: 'today' },
  { id: 'R009', store: 'river', project: 'courseCard', source: 'douyin', payment: 'douyinGroup', receivable: 7600, discount: 520, paid: 7080, orders: 39, dateBucket: 'today' },
  { id: 'R010', store: 'east', project: 'courseCard', source: 'cashier', payment: 'corporate', receivable: 22000, discount: 2000, paid: 20000, orders: 3, dateBucket: 'today' },
  { id: 'R011', store: 'north', project: 'passCard', source: 'miniProgram', payment: 'free', receivable: 1200, discount: 1200, paid: 0, orders: 6, dateBucket: 'today' },
  { id: 'W001', store: 'north', project: 'venue', source: 'miniProgram', payment: 'wechat', receivable: 68600, discount: 4200, paid: 64400, refund: 2800, orders: 318, dateBucket: 'week' },
  { id: 'W002', store: 'river', project: 'storedCard', source: 'cashier', payment: 'payCode', receivable: 82000, discount: 5600, paid: 76400, orders: 55, dateBucket: 'week' },
  { id: 'W003', store: 'east', project: 'goods', source: 'cashier', payment: 'offline', receivable: 21400, discount: 640, paid: 20760, orders: 302, dateBucket: 'week' },
  { id: 'W004', store: 'river', project: 'courseCard', source: 'douyin', payment: 'douyinGroup', receivable: 34600, discount: 2600, paid: 32000, refund: 1200, orders: 128, dateBucket: 'week' },
  { id: 'W005', store: 'north', project: 'passCard', source: 'meituan', payment: 'meituanGroup', receivable: 29600, discount: 1800, paid: 27800, orders: 116, dateBucket: 'week' },
  { id: 'M001', store: 'north', project: 'venue', source: 'cashier', payment: 'storedBalance', receivable: 36000, discount: 1200, paid: 34800, refund: 1200, orders: 118, dateBucket: 'month' },
  { id: 'M008', store: 'north', project: 'venue', source: 'miniProgram', payment: 'wechat', receivable: 118000, discount: 7200, paid: 110800, refund: 3000, orders: 354, dateBucket: 'month' },
  { id: 'M002', store: 'river', project: 'courseCard', source: 'miniProgram', payment: 'wechat', receivable: 210000, discount: 13000, paid: 197000, orders: 160, dateBucket: 'month' },
  { id: 'M003', store: 'east', project: 'storedCard', source: 'cashier', payment: 'corporate', receivable: 188000, discount: 11200, paid: 176800, orders: 86, dateBucket: 'month' },
  { id: 'M004', store: 'east', project: 'passCard', source: 'miniProgram', payment: 'wechat', receivable: 118000, discount: 7800, paid: 110200, orders: 264, dateBucket: 'month' },
  { id: 'M005', store: 'north', project: 'goods', source: 'cashier', payment: 'payCode', receivable: 39000, discount: 1100, paid: 37900, orders: 691, dateBucket: 'month' },
  { id: 'M006', store: 'river', project: 'passCard', source: 'meituan', payment: 'meituanGroup', receivable: 76000, discount: 5200, paid: 70800, refund: 3600, orders: 298, dateBucket: 'month' },
  { id: 'M007', store: 'east', project: 'courseCard', source: 'douyin', payment: 'douyinGroup', receivable: 62000, discount: 4200, paid: 57800, orders: 233, dateBucket: 'month' },
];


type OrderSummaryRow = {
  id: string;
  venue: string;
  orderType: string;
  productType: string;
  content: string;
  unitPrice: number;
  count: number;
  refund: number;
};

type OrderCategorySummaryRow = {
  id: string;
  venue: string;
  orderType: string;
  productType: string;
  category: string;
  count: number;
  amount: number;
  refund: number;
};

const orderSummaryRows: OrderSummaryRow[] = [
  { id: 'OS001', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '开业特惠海湾外馆游泳门票【限工作日指定时间使用】', unitPrice: 25, count: 8, refund: 0 },
  { id: 'OS002', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '开业特惠海湾外馆游泳门票【限工作日指定时间使用】', unitPrice: 25, count: 2, refund: 0 },
  { id: 'OS003', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '开业特惠海湾外馆游泳50次卡', unitPrice: 950, count: 3, refund: 950 },
  { id: 'OS004', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳门票', unitPrice: 32, count: 16, refund: 64 },
  { id: 'OS005', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '海湾外馆游泳门票', unitPrice: 32, count: 5, refund: 0 },
  { id: 'OS006', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳儿童票', unitPrice: 22, count: 7, refund: 22 },
  { id: 'OS007', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '海湾外馆游泳儿童票', unitPrice: 22, count: 3, refund: 0 },
  { id: 'OS008', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳亲子套票', unitPrice: 48, count: 6, refund: 0 },
  { id: 'OS009', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '海湾外馆游泳亲子套票', unitPrice: 48, count: 2, refund: 48 },
  { id: 'OS010', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳10次卡', unitPrice: 260, count: 2, refund: 0 },
  { id: 'OS011', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳20次卡', unitPrice: 480, count: 1, refund: 0 },
  { id: 'OS012', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳30次卡', unitPrice: 660, count: 2, refund: 0 },
  { id: 'OS013', venue: '晋爵会海湾外馆', orderType: '卡类订单', productType: '次卡', content: '海湾外馆游泳50次卡', unitPrice: 1050, count: 1, refund: 0 },
  { id: 'OS014', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '沐浴露', unitPrice: 1, count: 12, refund: 0 },
  { id: 'OS015', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '一次性浴巾', unitPrice: 5, count: 9, refund: 0 },
  { id: 'OS016', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '泳圈', unitPrice: 35, count: 2, refund: 0 },
  { id: 'OS017', venue: '晋爵会海湾外馆', orderType: '快捷收款订单', productType: '快捷商品', content: '英发2800泳镜', unitPrice: 129, count: 1, refund: 0 },
];

const projectDetailCatalog: Record<Project, { name: string; weight: number }[]> = {
  passCard: [
    { name: '单次卡', weight: 0.28 },
    { name: '10次卡', weight: 0.18 },
    { name: '月卡', weight: 0.22 },
    { name: '季卡', weight: 0.17 },
    { name: '半年卡', weight: 0.08 },
    { name: '年卡', weight: 0.07 },
  ],
  courseCard: [
    { name: '私教包月卡', weight: 0.28 },
    { name: '私教5次课', weight: 0.18 },
    { name: '28天私教瘦身课', weight: 0.22 },
    { name: '青少年基础课', weight: 0.14 },
    { name: '成人入门课', weight: 0.1 },
    { name: '小班提高课', weight: 0.08 },
  ],
  storedCard: [
    { name: '篮球储值卡', weight: 0.28 },
    { name: '羽毛球储值卡', weight: 0.32 },
    { name: '游泳储值卡', weight: 0.18 },
    { name: '通用储值卡', weight: 0.1 },
    { name: '企业团建储值卡', weight: 0.07 },
    { name: '亲子运动储值卡', weight: 0.05 },
  ],
  venue: [
    { name: '篮球场', weight: 0.3 },
    { name: '羽毛球场', weight: 0.36 },
    { name: '游泳泳道', weight: 0.12 },
    { name: '综合训练区', weight: 0.08 },
    { name: '乒乓球台', weight: 0.08 },
    { name: '多功能教室', weight: 0.06 },
  ],
  goods: [
    { name: '羽毛球拍', weight: 0.24 },
    { name: '泳衣', weight: 0.18 },
    { name: '运动饮料', weight: 0.16 },
    { name: '球线 / 手胶', weight: 0.12 },
    { name: '泳镜', weight: 0.1 },
    { name: '直接收款', weight: 0.2 },
  ],
};

type RecognitionCardSale = {
  id: string;
  member: string;
  store: Exclude<StoreId, 'all'>;
  category: 'timeCard' | 'privateCourse' | 'storedValue' | 'goods';
  product: string;
  paidAt: string;
  paid: number;
  periods: number;
  orders: number;
};

const recognitionCardSales: RecognitionCardSale[] = [
  { id: 'T101', member: '张航', store: 'softB', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-01', paid: 2680, periods: 4, orders: 1 },
  { id: 'T102', member: '苏晴', store: 'softB', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-06-04', paid: 5200, periods: 3, orders: 1 },
  { id: 'T103', member: '黄佳怡', store: 'softB', category: 'timeCard', product: '自助训练双月卡', paidAt: '2026-05-26', paid: 1680, periods: 2, orders: 1 },
  { id: 'T104', member: '许诺', store: 'softF', category: 'timeCard', product: '自助训练月卡', paidAt: '2026-06-02', paid: 980, periods: 1, orders: 1 },
  { id: 'T105', member: '梁楷', store: 'softF', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-06-06', paid: 3600, periods: 3, orders: 1 },
  { id: 'T106', member: '郑晨', store: 'softF', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-05-15', paid: 2480, periods: 4, orders: 1 },
  { id: 'T107', member: '吴桐', store: 'huaqiao', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-07', paid: 2580, periods: 4, orders: 1 },
  { id: 'T108', member: '叶琳', store: 'huaqiao', category: 'privateCourse', product: '1V1私教包月卡', paidAt: '2026-06-09', paid: 2600, periods: 1, orders: 1 },
  { id: 'T109', member: '韩越', store: 'huaqiao', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-04-18', paid: 6800, periods: 3, orders: 1 },
  { id: 'T110', member: '罗旭', store: 'jiageng', category: 'timeCard', product: '自助训练双月卡', paidAt: '2026-06-10', paid: 1880, periods: 2, orders: 1 },
  { id: 'T111', member: '曾敏', store: 'jiageng', category: 'privateCourse', product: '1V2私教包月卡', paidAt: '2026-06-13', paid: 2980, periods: 1, orders: 1 },
  { id: 'T112', member: '赵一鸣', store: 'jiageng', category: 'goods', product: '蛋白粉套装', paidAt: '2026-06-15', paid: 780, periods: 1, orders: 1 },
  { id: 'T113', member: '林舒', store: 'lvcuo', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-03', paid: 2780, periods: 4, orders: 1 },
  { id: 'T114', member: '马骁', store: 'lvcuo', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-05-12', paid: 5600, periods: 3, orders: 1 },
  { id: 'T115', member: '陈若', store: 'lvcuo', category: 'goods', product: '健身礼包', paidAt: '2026-06-18', paid: 680, periods: 1, orders: 1 },
  { id: 'T116', member: '方知远', store: 'dihao', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-05', paid: 2980, periods: 4, orders: 1 },
  { id: 'T117', member: '钱语', store: 'dihao', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-06-08', paid: 7200, periods: 3, orders: 1 },
  { id: 'T118', member: '唐森', store: 'dihao', category: 'timeCard', product: '自助训练双月卡', paidAt: '2026-05-28', paid: 1080, periods: 2, orders: 1 },
  { id: 'T119', member: '姚可', store: 'sibei', category: 'timeCard', product: '自助训练双月卡', paidAt: '2026-06-11', paid: 1880, periods: 2, orders: 1 },
  { id: 'T120', member: '顾铭', store: 'sibei', category: 'privateCourse', product: '1V3私教包月卡', paidAt: '2026-06-12', paid: 3200, periods: 1, orders: 1 },
  { id: 'T121', member: '沈沐', store: 'sibei', category: 'goods', product: '营养补给套装', paidAt: '2026-06-20', paid: 980, periods: 1, orders: 1 },
  { id: 'T122', member: '蒋乐', store: 'xianglu', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-02', paid: 2680, periods: 4, orders: 1 },
  { id: 'T123', member: '宋婷', store: 'xianglu', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-05-22', paid: 4200, periods: 3, orders: 1 },
  { id: 'T124', member: '范泽', store: 'xianglu', category: 'goods', product: '筋膜放松套装', paidAt: '2026-06-17', paid: 780, periods: 1, orders: 1 },
  { id: 'T125', member: '邱宁', store: 'wanda', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-06', paid: 2880, periods: 4, orders: 1 },
  { id: 'T126', member: '孟琪', store: 'wanda', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-06-14', paid: 5400, periods: 3, orders: 1 },
  { id: 'T127', member: '邵岩', store: 'wanda', category: 'timeCard', product: '自助训练双月卡', paidAt: '2026-04-09', paid: 1680, periods: 2, orders: 1 },
  { id: 'T128', member: '何雨', store: 'softB', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-02-16', paid: 6400, periods: 3, orders: 1 },
  { id: 'T129', member: '江莱', store: 'softF', category: 'goods', product: '运动装备套装', paidAt: '2026-06-22', paid: 1280, periods: 1, orders: 1 },
  { id: 'T130', member: '董青', store: 'jiageng', category: 'timeCard', product: '自助训练半月卡', paidAt: '2026-06-24', paid: 980, periods: 1, orders: 1 },
  { id: 'T001', member: '王小明', store: 'softB', category: 'timeCard', product: '自助训练月卡', paidAt: '2026-06-03', paid: 699, periods: 1, orders: 1 },
  { id: 'T002', member: '林可', store: 'softB', category: 'timeCard', product: '自助训练半月卡', paidAt: '2026-06-25', paid: 300, periods: 1, orders: 1 },
  { id: 'T003', member: '陈安', store: 'softF', category: 'timeCard', product: '自助训练双月卡', paidAt: '2026-05-18', paid: 1188, periods: 2, orders: 1 },
  { id: 'T004', member: '周宁', store: 'huaqiao', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-01-08', paid: 2399, periods: 4, orders: 1 },
  { id: 'T005', member: 'Mia', store: 'jiageng', category: 'privateCourse', product: '3节私教包', paidAt: '2026-06-12', paid: 1299, periods: 1, orders: 1 },
  { id: 'T006', member: '许哲', store: 'lvcuo', category: 'privateCourse', product: '私教包季卡', paidAt: '2026-04-20', paid: 899, periods: 3, orders: 1 },
  { id: 'T007', member: '何嘉', store: 'dihao', category: 'timeCard', product: '自助训练学期卡', paidAt: '2026-06-02', paid: 2599, periods: 4, orders: 1 },
  { id: 'T008', member: '赵悦', store: 'sibei', category: 'privateCourse', product: '私教单次卡', paidAt: '2026-06-08', paid: 1680, periods: 1, orders: 1 },
  { id: 'T009', member: '孙朗', store: 'xianglu', category: 'goods', product: '健身礼包', paidAt: '2026-06-10', paid: 399, periods: 1, orders: 1 },
  { id: 'T010', member: '刘欣', store: 'wanda', category: 'goods', product: '营养补给套装', paidAt: '2026-06-16', paid: 599, periods: 1, orders: 1 },
  { id: 'T011', member: '陆遥', store: 'softF', category: 'timeCard', product: '自助训练半月卡', paidAt: '2026-06-06', paid: 899, periods: 1, orders: 1 },
  { id: 'T012', member: '陈森', store: 'huaqiao', category: 'privateCourse', product: '1V1私教包月卡', paidAt: '2026-06-19', paid: 1999, periods: 1, orders: 1 },
  { id: 'T013', member: '李想', store: 'lvcuo', category: 'goods', product: '蛋白粉套装', paidAt: '2026-06-21', paid: 699, periods: 1, orders: 1 },
  { id: 'SV001', member: '\u5f20\u822a', store: 'softB', category: 'storedValue', product: '\u50a8\u503c\u5361 2000', paidAt: '2026-06-02', paid: 2000, periods: 1, orders: 1 },
  { id: 'SV002', member: '\u6797\u53ef', store: 'softF', category: 'storedValue', product: '\u50a8\u503c\u5361 3000', paidAt: '2026-05-12', paid: 3000, periods: 1, orders: 1 },
  { id: 'SV003', member: '\u9648\u5b89', store: 'huaqiao', category: 'storedValue', product: '\u50a8\u503c\u5361 5000', paidAt: '2026-04-20', paid: 5000, periods: 1, orders: 1 },
  { id: 'SV004', member: '\u5468\u5b81', store: 'wanda', category: 'storedValue', product: '\u50a8\u503c\u5361 1000', paidAt: '2026-06-16', paid: 1000, periods: 1, orders: 1 },
];

const recognitionCategoryMeta = {
  timeCard: { name: '\u6b21/\u65f6\u95f4\u5361', icon: CreditCard },
  privateCourse: { name: '\u79c1\u6559\u5361', icon: TicketCheck },
  storedValue: { name: '\u50a8\u503c\u5361\u9500\u552e', icon: Wallet },
  goods: { name: '\u5546\u54c1\u9500\u552e', icon: ShoppingBag },
} satisfies Record<RecognitionCardSale['category'], { name: string; icon: typeof CreditCard }>;

const recognitionCategoryRevenueTitle = {
  timeCard: '\u6b21/\u65f6\u95f4\u5361',
  privateCourse: '\u79c1\u6559\u5361',
  storedValue: '\u50a8\u503c\u5361',
  goods: '\u5546\u54c1\u9500\u552e',
} satisfies Record<RecognitionCardSale['category'], string>;

const defaultRecognitionMonth = '2026-06';

const recognitionMonthOptions = [
  { id: '2026-04', name: '2026年4月' },
  { id: '2026-05', name: '2026年5月' },
  { id: '2026-06', name: '2026年6月' },
  { id: '2026-07', name: '2026年7月' },
  { id: '2026-08', name: '2026年8月' },
];


function MobileManagerPreview() {
  const [report, setReport] = useState<MobileReport>('home');
  const [period, setPeriod] = useState<Period>('today');
  const activePeriod = periods.find((item) => item.id === period)!;
  const filtered = useMemo(() => {
    const bucket = period === 'custom' ? ['today', 'week'] : [period];
    return orders.filter((order) => bucket.includes(order.dateBucket));
  }, [period]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto min-h-screen max-w-[430px] px-4 pb-8 pt-5">
        {report === 'home' ? (
          <MobileHome onOpen={setReport} />
        ) : (
          <MobileReportPage report={report} period={period} activePeriod={activePeriod} orders={filtered} onPeriodChange={setPeriod} onBack={() => setReport('home')} />
        )}
      </div>
    </div>
  );
}

function MobileHome({ onOpen }: { onOpen: (report: MobileReport) => void }) {
  const reportItems = [
    { id: 'revenue', label: '营收报表', icon: CircleDollarSign, color: 'from-blue-400 to-cyan-400' },
    { id: 'venue', label: '场地报表', icon: CalendarDays, color: 'from-emerald-400 to-teal-400' },
    { id: 'course', label: '课程报表', icon: TicketCheck, color: 'from-violet-400 to-indigo-400' },
    { id: 'recognition', label: '确认收入', icon: ReceiptText, color: 'from-amber-400 to-orange-400' },
  ] satisfies { id: MobileReport; label: string; icon: typeof Store; color: string }[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Building2 size={24} className="text-cyan-600" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-xl font-black">运动场馆 <ChevronDown size={17} /></div>
            <div className="text-sm font-bold text-slate-500">卡猫贸易</div>
          </div>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-lg font-black shadow-sm">···</div>
      </div>

      <MobileSection title="我的常用" action="如何添加 ？" compact />

      <MobileSection title="统计报表">
        {reportItems.map((item) => (
          <div key={item.id}>
            <MobileIcon label={item.label} color={item.color} icon={item.icon} onClick={() => onOpen(item.id)} />
          </div>
        ))}
      </MobileSection>

      <MobileSection title="场馆管理">
        <MobileIcon label="场馆管理" color="from-teal-400 to-cyan-400" icon={Building2} />
        <MobileIcon label="灯控管理" color="from-yellow-400 to-orange-300" icon={RefreshCw} />
      </MobileSection>

      <MobileSection title="课程管理">
        <MobileIcon label="上课日程" color="from-blue-400 to-sky-300" icon={CalendarDays} />
        <MobileIcon label="创建排课" color="from-teal-400 to-emerald-300" icon={TicketCheck} />
      </MobileSection>

      <MobileSection title="卡券核销">
        <MobileIcon label="扫码核销" color="from-green-400 to-lime-400" icon={ReceiptText} />
        <MobileIcon label="核销记录" color="from-cyan-400 to-sky-400" icon={ArrowDownToLine} />
      </MobileSection>


    </div>
  );
}

function MobileSection({ title, action, compact, children }: { title: string; action?: string; compact?: boolean; children?: ReactNode }) {
  return (
    <section className={cn('rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60', compact ? 'flex min-h-14 items-center justify-between' : 'min-h-36')}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">{title}</h2>
        {action && <span className="text-sm font-bold text-slate-400">{action}</span>}
      </div>
      {children && <div className="mt-5 grid grid-cols-4 gap-x-3 gap-y-5">{children}</div>}
    </section>
  );
}

function MobileIcon({ label, color, icon: Icon, onClick }: { label: string; color: string; icon: typeof Store; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span className={cn('flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm', color)}>
        <Icon size={28} />
      </span>
      <span className="text-xs font-black leading-4 text-slate-600">{label}</span>
    </button>
  );
}

function MobileReportPage({
  report,
  period,
  activePeriod,
  orders,
  onPeriodChange,
  onBack,
}: {
  report: Exclude<MobileReport, 'home'>;
  period: Period;
  activePeriod: { id: Period; name: string; range: string };
  orders: RevenueOrder[];
  onPeriodChange: (period: Period) => void;
  onBack: () => void;
}) {
  const titleMap = { revenue: '营收报表', venue: '场地预订报表', course: '课程培训报表', recognition: '确认收入报表' } satisfies Record<Exclude<MobileReport, 'home'>, string>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="rounded-full bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm">返回</button>
        <div className="text-base font-black">{titleMap[report]}</div>
        <div className="w-12" />
      </div>
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {periods.slice(0, 3).map((item) => (
            <button key={item.id} onClick={() => onPeriodChange(item.id)} className={cn('h-9 rounded-xl text-sm font-black', period === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="mt-2 text-center text-xs font-bold text-slate-400">统计区间：{activePeriod.range}</div>
      </div>
      {report === 'revenue' && <MobileRevenueReport orders={orders} />}
      {report === 'venue' && <MobileVenueReport orders={orders} />}
      {report === 'course' && <MobileCourseReport />}
      {report === 'recognition' && <MobileRecognitionReport />}
      <div className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-bold text-slate-400 shadow-sm">更多明细请前往电脑后台查看</div>
    </div>
  );
}

function MobileRevenueReport({ orders }: { orders: RevenueOrder[] }) {
  const totals = summarize(orders);
  const operatingOrders = orders;
  const projectRows = orderProjectRows(groupBy(operatingOrders, 'project')).slice(0, 4);
  const sourceRows = groupBy(operatingOrders, 'source');

  return (
    <div className="space-y-3">
      <MobileMetricGrid>
        <MobileMetric title="平台营收金额" value={money(totals.actualRevenue)} tone="blue" />
        <MobileMetric title="销售总额" value={money(totals.sales)} />
        <MobileMetric title="退款金额" value={money(totals.refund)} />
        <MobileMetric title="储值卡/余额支付" value={money(totals.storedBalance)} />
      </MobileMetricGrid>
      <MobileListCard title="销售项目">
        {projectRows.map((row, index) => (
          <div key={row.key}>
            <MobileAmountRow rank={index + 1} label={projectMeta[row.key as Project].name} value={row.total.actualRevenue} total={totals.actualRevenue} />
          </div>
        ))}
      </MobileListCard>
      <MobileListCard title="销售渠道">
        {sourceRows.map((row, index) => (
          <div key={row.key}>
            <MobileAmountRow rank={index + 1} label={sourceMeta[row.key as Source].name} value={row.total.actualRevenue} total={totals.actualRevenue} note={row.key === 'cashier' ? '含商户扫码、用户扫码、线下付款、对公转账' : undefined} />
          </div>
        ))}
      </MobileListCard>
    </div>
  );
}

function MobileVenueReport({ orders }: { orders: RevenueOrder[] }) {
  const venueOrders = orders.filter((order) => order.project === 'venue');
  const totals = summarize(venueOrders);
  const storeRows = groupBy(venueOrders, 'store').slice(0, 4);
  const hours = Math.round(totals.orders * 1.4);

  return (
    <div className="space-y-3">
      <MobileMetricGrid>
        <MobileMetric title="预订金额" value={money(totals.actualRevenue)} tone="emerald" />
        <MobileMetric title="预订订单数" value={String(totals.orders) + ' 单'} />
        <MobileMetric title="场地使用时长" value={String(hours) + ' 小时'} />
        <MobileMetric title="预估使用率" value={String(Math.min(96, Math.round(totals.orders / 2.8))) + '%'} />
      </MobileMetricGrid>
      <MobileListCard title="热门场馆">
        {storeRows.map((row, index) => (
          <div key={row.key}>
            <MobileAmountRow rank={index + 1} label={stores.find((item) => item.id === row.key)?.name ?? row.key} value={row.total.actualRevenue} total={totals.actualRevenue} />
          </div>
        ))}
      </MobileListCard>
      <MobileListCard title="热门时段">
        {['18:00-20:00', '20:00-22:00', '16:00-18:00'].map((label, index) => (
          <div key={label}>
            <MobileAmountRow rank={index + 1} label={label} value={Math.round(totals.actualRevenue * [0.36, 0.28, 0.18][index])} total={totals.actualRevenue} />
          </div>
        ))}
      </MobileListCard>
    </div>
  );
}

function MobileCourseReport() {
  const totals = summarizeCourseStats(courseStats);
  const courseRows = groupCourseStats(courseStats, 'courseType').slice(0, 3);

  return (
    <div className="space-y-3">
      <MobileMetricGrid>
        <MobileMetric title="售课金额" value={money(totals.soldAmount)} tone="violet" />
        <MobileMetric title="消课金额" value={money(totals.completedAmount)} />
        <MobileMetric title="待履约金额" value={money(totals.soldHours > 0 ? Math.round((totals.soldAmount / totals.soldHours) * totals.remainingHours) : 0)} />
        <MobileMetric title="消课课时" value={String(totals.completedHours) + ' 课时'} />
      </MobileMetricGrid>
      <MobileListCard title="课程类型">
        {courseRows.map((row, index) => (
          <div key={row.key}>
            <MobileAmountRow rank={index + 1} label={courseTypeMeta[row.key as Exclude<CourseType, 'all'>].name} value={row.total.soldAmount} total={totals.soldAmount} />
          </div>
        ))}
      </MobileListCard>
      <MobileListCard title="教练消课排行">
        {groupCourseStats(courseStats, 'coach').slice(0, 3).map((row, index) => (
          <div key={row.key}>
            <MobileAmountRow rank={index + 1} label={coachOptions.find((item) => item.id === row.key)?.name ?? row.key} value={row.total.completedAmount} total={totals.completedAmount} />
          </div>
        ))}
      </MobileListCard>
    </div>
  );
}

function MobileRecognitionReport() {
  const month = defaultRecognitionMonth;
  const rows = recognitionCardSales.filter((row) => row.paidAt.startsWith(month));
  const sales = rows.reduce((sum, row) => sum + row.paid, 0);
  const recognized = Math.round(sales * 0.62);
  const pending = Math.max(sales - recognized, 0);
  const categoryRows = (Object.keys(recognitionCategoryMeta) as RecognitionCardSale['category'][]).map((category) => {
    const total = rows.filter((row) => row.category === category).reduce((sum, row) => sum + row.paid, 0);
    return { key: category, value: total };
  }).filter((row) => row.value > 0);

  return (
    <div className="space-y-3">
      <MobileMetricGrid>
        <MobileMetric title="本月确认收入" value={money(recognized)} tone="amber" />
        <MobileMetric title="本月销售金额" value={money(sales)} />
        <MobileMetric title="待确认收入余额" value={money(pending)} />
        <MobileMetric title="待确认期数" value={String(rows.reduce((sum, row) => sum + Math.max(row.periods - 1, 0), 0)) + ' 期'} />
      </MobileMetricGrid>
      <MobileListCard title="确认收入分类">
        {categoryRows.map((row, index) => (
          <div key={row.key}>
            <MobileAmountRow rank={index + 1} label={recognitionCategoryMeta[row.key].name} value={row.value} total={sales} />
          </div>
        ))}
      </MobileListCard>
      <MobileListCard title="确认来源">
        <MobileAmountRow rank={1} label="本月新售确认" value={Math.round(recognized * 0.68)} total={recognized} />
        <MobileAmountRow rank={2} label="往期确认" value={Math.round(recognized * 0.32)} total={recognized} />
      </MobileListCard>
    </div>
  );
}

function MobileMetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function MobileMetric({ title, value, tone }: { title: string; value: string; tone?: 'blue' | 'emerald' | 'violet' | 'amber' }) {
  const toneClass = tone === 'emerald' ? 'bg-emerald-600 text-white' : tone === 'violet' ? 'bg-violet-600 text-white' : tone === 'amber' ? 'bg-amber-500 text-white' : tone === 'blue' ? 'bg-blue-600 text-white' : 'bg-white text-slate-900';
  return (
    <div className={cn('min-h-24 rounded-2xl p-4 shadow-sm', toneClass)}>
      <div className={cn('text-xs font-bold', tone ? 'text-white/75' : 'text-slate-500')}>{title}</div>
      <div className="mt-3 text-xl font-black tracking-normal">{value}</div>
    </div>
  );
}

function MobileListCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="text-base font-black">{title}</div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function MobileAmountRow({ rank, label, value, total, note }: { rank?: number; label: string; value: number; total: number; note?: string }) {
  const percent = total > 0 ? Math.max((value / total) * 100, 0) : 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {rank && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-blue-600 shadow-sm">{rank}</span>}
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-slate-800">{label}</div>
          {note && <div className="mt-0.5 truncate text-xs font-bold text-slate-400">{note}</div>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-black tabular-nums text-slate-900">{money(value)}</div>
        <div className="mt-0.5 text-xs font-bold text-slate-400">占比 {percent.toFixed(1)}%</div>
      </div>
    </div>
  );
}

function App() {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const isMobilePreview = new URLSearchParams(search).get('view') === 'mobile';
  return isMobilePreview ? <MobileManagerPreview /> : <DesktopDashboard />;
}


function DesktopDashboard() {
  const [dashboard, setDashboard] = useState<DashboardType>('simpleRevenue');
  const [period, setPeriod] = useState<Period>('today');
  const [store, setStore] = useState<StoreId>('all');
  const [tab, setTab] = useState<Tab>('project');
  const [selectedProject, setSelectedProject] = useState<Project>('passCard');
  const [customRange, setCustomRange] = useState<CustomDateRange>({ start: '2026-05-24', end: '2026-06-03' });

  const filteredOrders = useMemo(() => {
    const bucket = period === 'custom' ? ['today', 'week'] : [period];
    return orders.filter((order) => {
      const inScope = dashboard === 'venue' || dashboard === 'simpleRevenue' || dashboard === 'venueBooking' || (order.project !== 'venue' && order.project !== 'storedCard');
      return inScope && bucket.includes(order.dateBucket) && (store === 'all' || order.store === store);
    });
  }, [dashboard, period, store]);

  const totals = useMemo(() => summarize(filteredOrders), [filteredOrders]);
  const projectRows = useMemo(() => orderProjectRows(groupBy(filteredOrders, 'project')), [filteredOrders]);
  const sourceRows = useMemo(() => groupBy(filteredOrders, 'source'), [filteredOrders]);
  const paymentRows = useMemo(() => groupBy(filteredOrders, 'payment'), [filteredOrders]);
  const storeRows = useMemo(() => groupBy(filteredOrders, 'store'), [filteredOrders]);
  const activePeriod = periods.find((item) => item.id === period)!;
  const miniProgramRevenue = useMemo(() => summarize(filteredOrders.filter((order) => order.source === 'miniProgram')).actualRevenue, [filteredOrders]);
  const cashierRevenue = useMemo(() => summarize(filteredOrders.filter((order) => order.source === 'cashier')).actualRevenue, [filteredOrders]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
            <Building2 size={21} />
          </div>
          <div>
            <div className="text-base font-black">卡猫数字场馆</div>
            <div className="text-xs font-semibold text-slate-500">经营收款看板</div>
          </div>
        </div>
        <nav className="px-3 py-4">
          {[
            { id: 'simpleRevenue', label: '营收报表', icon: CircleDollarSign },
            { id: 'venueBooking', label: '场地预订报表', icon: CalendarDays },
            { id: 'courseTraining', label: '课程培训报表', icon: TicketCheck },
            { id: 'recognition', label: '\u786e\u8ba4\u6536\u5165\u62a5\u8868', icon: ReceiptText },
            { id: 'orderStats', label: '订单统计', icon: ReceiptText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setDashboard(item.id as DashboardType);
                setSelectedProject('passCard');
              }}
              className={cn('mb-1 flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-bold', dashboard === item.id ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-100')}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Store size={14} />
                管理后台 / 营收分析
              </div>
              <h1 className="mt-1 text-xl font-black text-slate-800">{dashboard === 'orderStats' ? '订单统计' : dashboard === 'recognition' ? '\u786e\u8ba4\u6536\u5165\u62a5\u8868' : dashboard === 'courseTraining' ? '璇剧▼鍩硅鎶ヨ〃' : dashboard === 'venueBooking' ? '鍦哄湴棰勮鎶ヨ〃' : dashboard === 'simpleRevenue' ? '钀ユ敹缁熻' : '鏀跺叆鍒嗘瀽鐪嬫澘'}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="?view=mobile" className="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600">
                手机版预览
              </a>
              <IconAction label="刷新">
                <RefreshCw size={17} />
              </IconAction>
              <IconAction label="导出">
                <Download size={17} />
              </IconAction>
            </div>
          </div>
        </header>

        <section className="px-4 py-4 lg:px-6">
          {dashboard === 'orderStats' ? (
            <OrderStatisticsReport />
          ) : dashboard === 'recognition' ? (
            <RecognitionIncomeDashboard period={period} customRange={customRange} store={store} onPeriodChange={setPeriod} onCustomRangeChange={setCustomRange} onStoreChange={setStore} />
          ) : dashboard === 'simpleRevenue' ? (
            <SimpleRevenueDashboard period={period} store={store} customRange={customRange} onPeriodChange={setPeriod} onCustomRangeChange={setCustomRange} onStoreChange={setStore} orders={filteredOrders} />
          ) : dashboard === 'venueBooking' ? (
            <VenueBookingReport period={period} store={store} customRange={customRange} onPeriodChange={setPeriod} onCustomRangeChange={setCustomRange} onStoreChange={setStore} orders={filteredOrders} />
          ) : dashboard === 'courseTraining' ? (
            <CourseTrainingReport period={period} customRange={customRange} onPeriodChange={setPeriod} onCustomRangeChange={setCustomRange} />
          ) : (
            <>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
            <Segmented value={period} customRange={customRange} onChange={setPeriod} onCustomRangeChange={setCustomRange} />
            <SelectBox icon={Building2} value={store} onChange={(value) => setStore(value as StoreId)} options={stores} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="font-semibold text-slate-500">统计区间：{activePeriod.range}，仅统计支付成功 / 核销完成订单，不含撤单、作废订单。</div>
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              平台营收金额 = 销售总额 - 退款金额 - 储值卡/余额支付；美团、抖音等第三方团购核销计入经营发生口径。
            </div>
          </div>

          <section className={cn('mt-4 grid gap-2.5', dashboard === 'fitness' ? 'md:grid-cols-2 xl:grid-cols-5' : 'xl:grid-cols-[1.4fr_1fr]')}>
            {dashboard === 'fitness' ? (
              <>
                <MetricCard title="平台营收金额" value={money(totals.actualRevenue)} helper="经营发生口径" />
                <MetricCard title="小程序平台收款" value={money(miniProgramRevenue)} helper="小程序平台收款" />
                <MetricCard title="收银台平台收款" value={money(cashierRevenue)} helper="收银台平台收款" />
                <MetricCard title="美团核销" value={money(totals.meituan)} helper="第三方团购核销" />
                <MetricCard title="抖音核销" value={money(totals.douyin)} helper="第三方团购核销" />
              </>
            ) : (
              <>
                <RevenueTotalCard total={totals.actualRevenue} miniProgramRevenue={miniProgramRevenue} cashierRevenue={cashierRevenue} meituanRevenue={totals.meituan} douyinRevenue={totals.douyin} />
                <SalesBreakdownCards sales={totals.sales} storedBalance={totals.storedBalance} actualRevenue={totals.actualRevenue} refund={totals.refund} />
              </>
            )}
          </section>

          <section className="mt-4">
            <Panel title="项目统计" icon={BarChart3} subtitle="按经营发生额统计">
              <ProjectSummary rows={projectRows} orders={filteredOrders} selectedProject={selectedProject} onSelectProject={setSelectedProject} dashboard={dashboard} />
            </Panel>
          </section>

          <section className="mt-4">
            <Panel title="多维明细" icon={ArrowDownToLine}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'project', name: '销售项目' },
                    { id: 'source', name: '销售渠道' },
                    { id: 'payment', name: '收款方式' },
                    { id: 'store', name: '门店对比' },
                  ].map((item) => (
                    <button key={item.id} onClick={() => setTab(item.id as Tab)} className={cn('h-9 rounded-md px-3 text-sm font-bold', tab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
                      {item.name}
                    </button>
                  ))}
                </div>
                <button className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600">
                  <Download size={15} />
                  导出
                </button>
              </div>
              {tab === 'project' && <DataTable rows={projectRows} type="project" total={totals.businessAmount} dashboard={dashboard} />}
              {tab === 'source' && <DataTable rows={sourceRows} type="source" total={totals.businessAmount} dashboard={dashboard} />}
              {tab === 'payment' && <DataTable rows={paymentRows} type="payment" total={totals.businessAmount} dashboard={dashboard} />}
              {tab === 'store' && <DataTable rows={storeRows} type="store" total={totals.businessAmount} dashboard={dashboard} />}
            </Panel>
          </section>

          <section className="mt-4">
            <div className="rounded-lg border border-slate-100 bg-white px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center gap-2 text-sm font-black text-slate-800">
                  <ReceiptText size={16} />
                  统计口径说明
                </div>
                <Definition label="储值卡充值营收" value={`${money(totals.storedCardRevenue)}，按实收金额`} />
                <Definition label="美团核销额" value={`${money(totals.meituan)}，第三方团购`} />
                <Definition label="抖音核销额" value={`${money(totals.douyin)}，第三方团购`} />
                <Definition label="商品销售" value="含直接收款" />
              </div>
            </div>
          </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}



function getOrderItemCategory(row: OrderSummaryRow) {
  if (row.productType === '次卡') {
    return /10次卡|20次卡|30次卡|50次卡/.test(row.content) ? '多次卡' : '门票';
  }
  if (row.productType === '快捷商品') {
    return /门票|儿童票|亲子套票/.test(row.content) ? '门票' : '泳具';
  }
  return '-';
}

function buildOrderCategorySummaryRows(rows: OrderSummaryRow[]): OrderCategorySummaryRow[] {
  const grouped = new Map<string, OrderCategorySummaryRow>();
  rows.forEach((row) => {
    const category = getOrderItemCategory(row);
    const key = [row.venue, row.orderType, row.productType, category].join('|');
    const current = grouped.get(key);
    const amount = row.unitPrice * row.count;
    if (current) {
      current.count += row.count;
      current.amount += amount;
      current.refund += row.refund;
    } else {
      grouped.set(key, {
        id: key,
        venue: row.venue,
        orderType: row.orderType,
        productType: row.productType,
        category,
        count: row.count,
        amount,
        refund: row.refund,
      });
    }
  });
  return Array.from(grouped.values());
}

function OrderStatisticsReport() {
  const [period, setPeriod] = useState<Period>('today');
  const [customRange, setCustomRange] = useState<CustomDateRange>({ start: '2026-06-29', end: '2026-06-29' });
  const [activeTab, setActiveTab] = useState<'all' | 'passCard' | 'timeCard' | 'goods' | 'courseCard'>('all');
  const [summaryMode, setSummaryMode] = useState<'detail' | 'category'>('detail');
  const [page, setPage] = useState(1);
  const rows = useMemo(() => orderSummaryRows.filter((row) => {
    if (activeTab === 'passCard') return row.productType === '次卡';
    if (activeTab === 'timeCard') return row.productType === '时间卡';
    if (activeTab === 'goods') return row.orderType === '快捷收款订单';
    if (activeTab === 'courseCard') return row.productType === '课程卡';
    return true;
  }), [activeTab]);
  const totals = useMemo(
    () => rows.reduce(
      (acc, row) => {
        const amount = row.unitPrice * row.count;
        acc.count += row.count;
        acc.amount += amount;
        acc.refund += row.refund;
        acc.net += amount - row.refund;
        return acc;
      },
      { count: 0, amount: 0, refund: 0, net: 0 },
    ),
    [rows],
  );
  const categoryRows = useMemo(() => buildOrderCategorySummaryRows(rows), [rows]);
  const rowCount = summaryMode === 'detail' ? rows.length : categoryRows.length;
  const pageSize = 10;
  const totalPages = Math.max(Math.ceil(rowCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pagedCategoryRows = categoryRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <Segmented
          value={period}
          customRange={customRange}
          onChange={(nextPeriod) => {
            setPeriod(nextPeriod);
            setPage(1);
          }}
          onCustomRangeChange={(nextRange) => {
            setCustomRange(nextRange);
            setPage(1);
          }}
        />
        <button className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600">
          <Download size={15} />
          导出
        </button>
      </div>

      <Panel title="订单汇总表" icon={ReceiptText}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
            汇总维度
            <select
              value={summaryMode}
              onChange={(event) => {
                setSummaryMode(event.target.value as 'detail' | 'category');
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="detail">商品名称</option>
              <option value="category">项目分类汇总</option>
            </select>
          </label>
          <div className="text-xs font-bold text-slate-400">按当前筛选结果统计</div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { id: 'all', name: '全部' },
            { id: 'passCard', name: '次卡统计' },
            { id: 'timeCard', name: '时间卡统计' },
            { id: 'goods', name: '商品销售统计' },
            { id: 'courseCard', name: '课程卡统计' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as 'all' | 'passCard' | 'timeCard' | 'goods' | 'courseCard');
                setPage(1);
              }}
              className={cn('h-9 rounded-md px-3 text-sm font-bold', activeTab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          {summaryMode === 'detail' ? (
            <table className="min-w-[1280px] w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-black text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">下单场馆</th>
                  <th className="border-b border-slate-200 px-3 py-3">订单类型</th>
                  <th className="border-b border-slate-200 px-3 py-3">产品类型</th>
                  <th className="border-b border-slate-200 px-3 py-3">项目分类</th>
                  <th className="border-b border-slate-200 px-3 py-3">商品名称</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">单价</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">订单数</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">订单金额</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">退款金额</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">实收金额</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const amount = row.unitPrice * row.count;
                  const net = amount - row.refund;
                  return (
                    <tr key={row.id} className="bg-white hover:bg-slate-50/70">
                      <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-700">{row.venue}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.orderType}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.productType}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{getOrderItemCategory(row)}</td>
                      <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-800">{row.content}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.unitPrice)}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.count}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-right font-bold tabular-nums text-slate-800">{money(amount)}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600">{row.refund > 0 ? money(row.refund) : '-'}</td>
                      <td className="border-b border-slate-100 px-3 py-3 text-right font-black tabular-nums text-slate-900">{money(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 text-sm font-black text-slate-900">
                  <td className="px-3 py-3" colSpan={6}>合计</td>
                  <td className="px-3 py-3 text-right tabular-nums">{totals.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(totals.amount)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-rose-600">{money(totals.refund)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(totals.net)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="min-w-[960px] w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-black text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">下单场馆</th>
                  <th className="border-b border-slate-200 px-3 py-3">订单类型</th>
                  <th className="border-b border-slate-200 px-3 py-3">产品类型</th>
                  <th className="border-b border-slate-200 px-3 py-3">项目分类</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">订单数</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">订单金额</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">退款金额</th>
                  <th className="border-b border-slate-200 px-3 py-3 text-right">实收金额</th>
                </tr>
              </thead>
              <tbody>
                {pagedCategoryRows.map((row) => (
                  <tr key={row.id} className="bg-white hover:bg-slate-50/70">
                    <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-700">{row.venue}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.orderType}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.productType}</td>
                    <td className="border-b border-slate-100 px-3 py-3 font-bold text-slate-800">{row.category}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.count}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right font-bold tabular-nums text-slate-800">{money(row.amount)}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600">{row.refund > 0 ? money(row.refund) : '-'}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-right font-black tabular-nums text-slate-900">{money(row.amount - row.refund)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 text-sm font-black text-slate-900">
                  <td className="px-3 py-3" colSpan={4}>合计</td>
                  <td className="px-3 py-3 text-right tabular-nums">{totals.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(totals.amount)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-rose-600">{money(totals.refund)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(totals.net)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="font-bold text-slate-500">
            共 {rowCount} 条，每页 10 条，当前第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage <= 1}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SimpleRevenueDashboard({
  period,
  store,
  customRange,
  onPeriodChange,
  onCustomRangeChange,
  onStoreChange,
  orders,
}: {
  period: Period;
  store: StoreId;
  customRange: CustomDateRange;
  onPeriodChange: (period: Period) => void;
  onCustomRangeChange: (range: CustomDateRange) => void;
  onStoreChange: (store: StoreId) => void;
  orders: RevenueOrder[];
}) {
  const platformRevenueOrders = useMemo(() => orders.filter(isPlatformRevenueOrder), [orders]);
  const platformTotals = useMemo(() => summarize(platformRevenueOrders), [platformRevenueOrders]);
  const storedValueMetrics = useMemo(() => summarizeStoredValueFlow(orders), [orders]);
  const thirdPartyMetrics = useMemo(() => summarizeThirdPartyVoucher(orders), [orders]);
  const compositionOrders = useMemo(() => orders.filter((order) => order.project !== 'storedCard'), [orders]);
  const projectRows = useMemo(() => orderProjectRows(groupByRevenueComposition(compositionOrders, 'project')), [compositionOrders]);
  const sourceRows = useMemo(() => groupByRevenueComposition(compositionOrders, 'source'), [compositionOrders]);
  const activePeriod = getActivePeriod(period, customRange);
  const prepaidRows = useMemo(() => buildRevenuePrepaidRows(orders), [orders]);
  const [revenueBreakdownTab, setRevenueBreakdownTab] = useState<'salesProject' | 'salesChannel' | 'prepaid'>('salesProject');
  const revenueBreakdownRows = revenueBreakdownTab === 'salesProject' ? projectRows : sourceRows;
  const revenueBreakdownType = revenueBreakdownTab === 'salesProject' ? 'project' : 'source';
  const revenueBreakdownTitle = revenueBreakdownTab === 'salesProject' ? '销售项目构成' : '销售渠道构成';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Segmented value={period} customRange={customRange} onChange={onPeriodChange} onCustomRangeChange={onCustomRangeChange} />
          <div className="mt-1.5 text-xs font-semibold text-slate-500">统计区间：{activePeriod.range}</div>
        </div>
        <SelectBox icon={Building2} value={store} onChange={(value) => onStoreChange(value as StoreId)} options={stores} />
      </div>

      <SectionIntro title="营收概况" />

      <section className="grid gap-4 xl:grid-cols-3">
        <RevenueOverviewPanel
          title="平台营收"
          icon={Wallet}
          tone="blue"
          primaryLabel="平台营收金额"
          primaryValue={platformTotals.actualRevenue}
          items={[
            { label: '平台销售额', value: platformTotals.sales },
            { label: '平台退款额', value: platformTotals.refund },
          ]}
          helper="仅统计小程序、收银台支付成功订单，不含储值卡/余额支付和第三方团购核销。"
        />
        <RevenueOverviewPanel
          title="储值卡/余额收支"
          icon={CreditCard}
          tone="emerald"
          primaryLabel="期末储值卡/余额"
          primaryValue={storedValueMetrics.balance}
          items={[
            { label: '售卡/余额充值', value: storedValueMetrics.sales },
            { label: '储值卡/余额消耗', value: storedValueMetrics.consumed },
          ]}
          helper="储值卡/余额属于预收款，消耗时不重复计入平台营收。"
        />
        <RevenueOverviewPanel
          title="第三方团购核销"
          icon={TicketCheck}
          tone="amber"
          primaryLabel="团购核销金额"
          primaryValue={thirdPartyMetrics.total}
          items={[
            { label: '美团核销', value: thirdPartyMetrics.meituan },
            { label: '抖音核销', value: thirdPartyMetrics.douyin },
          ]}
          helper="仅统计平台核销兑换金额；补贴券、商家券、退款需到第三方平台核对。"
        />
      </section>


      <SectionIntro title="经营构成分析" />

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'salesProject', name: '销售项目' },
          { id: 'salesChannel', name: '销售渠道' },
          { id: 'prepaid', name: '预收款' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setRevenueBreakdownTab(item.id as typeof revenueBreakdownTab)}
            className={cn('h-9 rounded-md px-3 text-sm font-bold', revenueBreakdownTab === item.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}
          >
            {item.name}
          </button>
        ))}
      </div>

      {revenueBreakdownTab === 'prepaid' ? (
        <RevenuePrepaidSummaryTable rows={prepaidRows} />
      ) : (
        <RevenueBreakdownTable title={revenueBreakdownTitle} rows={revenueBreakdownRows} type={revenueBreakdownType} total={summarizeRevenueComposition(compositionOrders).businessAmount} />
      )}

      <SectionIntro title="品项明细统计" />

      <RevenueSalesItemStatsPanel orders={orders} />

      <SettlementReconciliationPanel orders={orders} />

      <KeyMetricNotes
        items={[
          '平台营收金额 = 平台销售额 - 平台退款额；平台销售额不含储值卡销售、余额充值、储值卡/余额支付和第三方团购核销。',
          '销售项目、销售渠道统计业务消费和核销发生；经营发生额 = 平台营收金额 + 储值卡/余额支付 + 第三方团购核销。',
          '预收款 TAB 单独统计储值卡销售和余额充值的新售卡/充值金额、退款金额和净收款金额。',
          '第三方团购核销仅统计平台核销兑换金额；补贴券、商家券、退款需到美团/抖音平台核对。',
          '收款归集按资金入账去向展示，平台收款和商户自行收款按实际收款扣退款统计，第三方团购按核销金额统计。',
          '账户对账仅统计平台收款，包含业务消费收款及储值卡销售、余额充值收款；同一场馆同一账户合并展示渠道，不同场馆即使共用账户也按场馆拆分；金额已扣退款，未扣支付手续费。',
        ]}
      />

    </div>
  );
}

type RevenueOverviewPanelProps = {
  title: string;
  icon: typeof Store;
  tone: 'blue' | 'emerald' | 'amber';
  primaryLabel: string;
  primaryValue: number;
  items: { label: string; value: number }[];
  helper: string;
};

function RevenueOverviewPanel({ title, icon: Icon, tone, primaryLabel, primaryValue, items, helper }: RevenueOverviewPanelProps) {
  const toneClass = tone === 'blue'
    ? 'border-blue-100 bg-blue-50/70 text-blue-800'
    : tone === 'emerald'
      ? 'border-emerald-100 bg-emerald-50/70 text-emerald-800'
      : 'border-amber-100 bg-amber-50/80 text-amber-800';

  return (
    <section className={cn('rounded-xl border p-4 shadow-sm shadow-slate-200/40', toneClass)}>
      <div className="flex items-center gap-2 text-sm font-black">
        <Icon size={17} />
        {title}
      </div>
      <div className="mt-3 rounded-lg bg-white/70 px-3 py-3">
        <div className="text-xs font-bold opacity-70">{primaryLabel}</div>
        <div className="mt-1.5 text-3xl font-black tracking-normal">{money(primaryValue)}</div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-white/60 px-3 py-2">
            <div className="text-[11px] font-bold opacity-65">{item.label}</div>
            <div className="mt-1 text-base font-black tabular-nums">{money(item.value)}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[11px] font-semibold leading-5 opacity-75">{helper}</div>
    </section>
  );
}

function isPlatformRevenueOrder(order: RevenueOrder) {
  if (order.payment === 'meituanGroup' || order.payment === 'douyinGroup') return false;
  if (order.payment === 'storedBalance' || order.payment === 'free') return false;
  if (order.project === 'storedCard') return false;
  return order.source === 'miniProgram' || order.source === 'cashier';
}

function summarizeStoredValueFlow(orders: RevenueOrder[]) {
  const sales = orders.filter((order) => order.project === 'storedCard').reduce((sum, order) => sum + order.paid, 0);
  const consumed = orders.filter((order) => order.payment === 'storedBalance').reduce((sum, order) => sum + order.paid, 0);
  const balance = Math.max(Math.round(sales * 3.2 - consumed), 0);
  return { sales, consumed, balance };
}

function summarizeThirdPartyVoucher(orders: RevenueOrder[]) {
  const meituan = orders.filter((order) => order.payment === 'meituanGroup').reduce((sum, order) => sum + order.paid, 0);
  const douyin = orders.filter((order) => order.payment === 'douyinGroup').reduce((sum, order) => sum + order.paid, 0);
  return { meituan, douyin, total: meituan + douyin };
}

function SectionIntro({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <div className="text-base font-black text-slate-800">{title}</div>
      {description && <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{description}</div>}
    </div>
  );
}

function KeyMetricNotes({ items }: { items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30">
      <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
        <ReceiptText size={16} />
        关键口径说明
      </div>
      <ul className="grid gap-1.5 text-xs font-semibold leading-5 text-slate-500 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BillFormulaItem({ label, value, note, primary, details }: { label: string; value: string; note?: string; primary?: boolean; details?: { label: string; value: string }[] }) {
  return (
    <div className={cn('min-w-0 border-slate-100 xl:border-r xl:pr-6', primary && 'xl:pr-8')}>
      <div className="flex items-center gap-1.5 text-sm font-black text-slate-600">
        {label}
        {!primary && <CircleDollarSign size={15} className="text-slate-400" />}
      </div>
      <div className={cn('mt-3 font-black tracking-normal text-slate-900', primary ? 'text-4xl' : 'text-3xl')}>{value}</div>
      {details && (
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="rounded bg-slate-50 px-2 py-1.5 text-xs font-bold">
              <div className="truncate text-slate-400">{item.label}</div>
              <div className="mt-0.5 truncate tabular-nums text-slate-800">{item.value}</div>
            </div>
          ))}
        </div>
      )}
      {note && <div className="mt-2 text-xs font-semibold leading-5 text-slate-500">{note}</div>}
    </div>
  );
}

function FormulaOperator({ value }: { value: '=' | '-' | '+' }) {
  return (
    <div className="hidden text-2xl font-black text-slate-900 xl:block">{value}</div>
  );
}

function SummaryMiniStat({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'blue' | 'amber' | 'muted' }) {
  return (
    <div className={cn('min-w-0 rounded px-2 py-1.5', tone === 'blue' ? 'bg-blue-50 text-blue-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'muted' ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-700')}>
      <div className="truncate text-[10px] font-bold opacity-75">{label}</div>
      <div className="mt-0.5 truncate tabular-nums">{value}</div>
    </div>
  );
}

type RevenueSalesItemRow = {
  store: Exclude<StoreId, 'all'>;
  project: Project;
  projectName: string;
  itemName: string;
  sales: number;
  refund: number;
  actualRevenue: number;
  storedBalance: number;
  thirdPartyGroup: number;
  businessAmount: number;
};

type RevenuePrepaidRow = {
  key: 'storedCard' | 'balanceRecharge';
  sales: number;
  refund: number;
  netAmount: number;
  orders: number;
};

type RevenuePrepaidItemRow = RevenuePrepaidRow & {
  store: Exclude<StoreId, 'all'>;
  source: Source;
  itemName: string;
};

function RevenueSalesItemStatsPanel({ orders }: { orders: RevenueOrder[] }) {
  const [itemTab, setItemTab] = useState<'business' | 'prepaid'>('business');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const businessOrders = useMemo(() => orders.filter((order) => order.project !== 'storedCard'), [orders]);
  const prepaidOrders = useMemo(() => orders.filter((order) => order.project === 'storedCard'), [orders]);

  const rows = useMemo(() => buildRevenueSalesItemRows(businessOrders), [businessOrders]);
  const prepaidRows = useMemo(() => buildRevenuePrepaidItemRows(prepaidOrders), [prepaidOrders]);
  const visibleRows = itemTab === 'business' ? rows : [];
  const visiblePrepaidRows = itemTab === 'prepaid' ? prepaidRows : [];
  const total = useMemo(() => summarizeSalesItemRows(rows), [rows]);
  const prepaidTotal = useMemo(() => summarizePrepaidRows(prepaidRows), [prepaidRows]);
  const rowCount = itemTab === 'business' ? visibleRows.length : visiblePrepaidRows.length;
  const totalPages = Math.max(Math.ceil(rowCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pageRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pagePrepaidRows = visiblePrepaidRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="rounded-lg border border-slate-100 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-lg font-black text-slate-800">
            <ReceiptText size={17} />
          </div>
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
            {[
              { id: 'business', name: '业务消费品项' },
              { id: 'prepaid', name: '预收款品项' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setItemTab(item.id as typeof itemTab); setPage(1); }}
                className={cn('rounded px-4 py-2 text-sm font-black transition', itemTab === item.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900')}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-sm font-bold text-white">
            <Download size={15} />
            导出
          </button>
        </div>
      </div>

      {itemTab === 'business' ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-black text-slate-500">
                <th className="border-b border-slate-100 px-4 py-3 text-left">门店</th>
                <th className="border-b border-slate-100 px-4 py-3 text-left">销售项目</th>
                <th className="border-b border-slate-100 px-4 py-3 text-left">销售品项</th>
                <th className="border-b border-slate-100 px-4 py-3 text-right">平台销售额</th>
                <th className="border-b border-slate-100 px-4 py-3 text-right">平台退款额</th>
                <th className="border-b border-slate-100 bg-blue-50/60 px-4 py-3 text-right text-blue-700">平台营收金额</th>
                <th className="border-b border-slate-100 bg-emerald-50/60 px-4 py-3 text-right text-emerald-700">储值卡/余额支付</th>
                <th className="border-b border-slate-100 bg-amber-50/60 px-4 py-3 text-right text-amber-700">第三方团购核销</th>
                <th className="border-b border-slate-100 bg-slate-100 px-4 py-3 text-right text-slate-800">经营发生额</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.store + row.project + row.itemName} className="font-bold text-slate-800">
                  <td className="border-b border-slate-100 px-4 py-3">{stores.find((item) => item.id === row.store)?.name ?? row.store}</td>
                  <td className="border-b border-slate-100 px-4 py-3">{row.projectName}</td>
                  <td className="border-b border-slate-100 px-4 py-3">{row.itemName}</td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums">{money(row.sales)}</td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums text-rose-600">{money(row.refund)}</td>
                  <td className="border-b border-slate-100 bg-blue-50/40 px-4 py-3 text-right font-black tabular-nums text-blue-700">{money(row.actualRevenue)}</td>
                  <td className="border-b border-slate-100 bg-emerald-50/40 px-4 py-3 text-right tabular-nums text-emerald-700">{money(row.storedBalance)}</td>
                  <td className="border-b border-slate-100 bg-amber-50/40 px-4 py-3 text-right tabular-nums text-amber-700">{money(row.thirdPartyGroup)}</td>
                  <td className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-right font-black tabular-nums text-slate-900">{money(row.businessAmount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 text-sm font-black text-slate-900">
                <td className="border-t border-slate-200 px-4 py-3" colSpan={3}>合计</td>
                <td className="border-t border-slate-200 px-4 py-3 text-right tabular-nums">{money(total.sales)}</td>
                <td className="border-t border-slate-200 px-4 py-3 text-right tabular-nums text-rose-600">{money(total.refund)}</td>
                <td className="border-t border-slate-200 bg-blue-50/60 px-4 py-3 text-right tabular-nums text-blue-700">{money(total.actualRevenue)}</td>
                <td className="border-t border-slate-200 bg-emerald-50/60 px-4 py-3 text-right tabular-nums text-emerald-700">{money(total.storedBalance)}</td>
                <td className="border-t border-slate-200 bg-amber-50/60 px-4 py-3 text-right tabular-nums text-amber-700">{money(total.thirdPartyGroup)}</td>
                <td className="border-t border-slate-200 bg-slate-100 px-4 py-3 text-right tabular-nums">{money(total.businessAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-black text-slate-500">
                <th className="border-b border-slate-100 px-4 py-3 text-left">门店</th>
                <th className="border-b border-slate-100 px-4 py-3 text-left">预收项目</th>
                <th className="border-b border-slate-100 px-4 py-3 text-left">收款渠道</th>
                <th className="border-b border-slate-100 px-4 py-3 text-right">新售卡/充值金额</th>
                <th className="border-b border-slate-100 px-4 py-3 text-right">退款金额</th>
                <th className="border-b border-slate-100 bg-emerald-50/60 px-4 py-3 text-right text-emerald-700">净收款金额</th>
              </tr>
            </thead>
            <tbody>
              {pagePrepaidRows.map((row) => (
                <tr key={row.store + row.key + row.source} className="font-bold text-slate-800">
                  <td className="border-b border-slate-100 px-4 py-3">{stores.find((item) => item.id === row.store)?.name ?? row.store}</td>
                  <td className="border-b border-slate-100 px-4 py-3">{row.itemName}</td>
                  <td className="border-b border-slate-100 px-4 py-3">{sourceMeta[row.source].name}</td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums">{money(row.sales)}</td>
                  <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums text-rose-600">{money(row.refund)}</td>
                  <td className="border-b border-slate-100 bg-emerald-50/40 px-4 py-3 text-right font-black tabular-nums text-emerald-700">{money(row.netAmount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 text-sm font-black text-slate-900">
                <td className="border-t border-slate-200 px-4 py-3" colSpan={3}>合计</td>
                <td className="border-t border-slate-200 px-4 py-3 text-right tabular-nums">{money(prepaidTotal.sales)}</td>
                <td className="border-t border-slate-200 px-4 py-3 text-right tabular-nums text-rose-600">{money(prepaidTotal.refund)}</td>
                <td className="border-t border-slate-200 bg-emerald-50/60 px-4 py-3 text-right tabular-nums text-emerald-700">{money(prepaidTotal.netAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-500">
        <span>共 {rowCount} 条，当前第 {currentPage} / {totalPages} 页</span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="h-8 rounded-md border border-slate-200 px-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">上一页</button>
          <button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} className="h-8 rounded-md border border-slate-200 px-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">下一页</button>
        </div>
      </div>
    </section>
  );
}

function buildRevenueSalesItemRows(orders: RevenueOrder[]): RevenueSalesItemRow[] {
  const grouped = new Map<string, RevenueSalesItemRow>();
  const addRow = (order: RevenueOrder, itemName: string, amount: { sales: number; refund: number; actualRevenue: number; storedBalance: number; thirdPartyGroup: number; businessAmount: number }) => {
    const projectName = getRevenueSalesProjectName(order.project, itemName);
    const key = [order.store, projectName, itemName].join('|');
    const current = grouped.get(key) ?? {
      store: order.store,
      project: order.project,
      projectName,
      itemName,
      sales: 0,
      refund: 0,
      actualRevenue: 0,
      storedBalance: 0,
      thirdPartyGroup: 0,
      businessAmount: 0,
    };
    current.sales += amount.sales;
    current.refund += amount.refund;
    current.actualRevenue += amount.actualRevenue;
    current.storedBalance += amount.storedBalance;
    current.thirdPartyGroup += amount.thirdPartyGroup;
    current.businessAmount += amount.businessAmount;
    grouped.set(key, current);
  };

  orders.forEach((order) => {
    const amount = summarizeRevenueComposition([order]);
    addRow(order, getRevenueSalesItemName(order), {
      sales: amount.sales,
      refund: amount.refund,
      actualRevenue: amount.actualRevenue,
      storedBalance: amount.storedBalance,
      thirdPartyGroup: amount.thirdPartyGroup,
      businessAmount: amount.businessAmount,
    });
  });

  return Array.from(grouped.values()).filter((row) => row.businessAmount > 0).sort((a, b) => {
    const storeCompare = (stores.findIndex((item) => item.id === a.store) - stores.findIndex((item) => item.id === b.store));
    if (storeCompare !== 0) return storeCompare;
    if (a.projectName !== b.projectName) return a.projectName.localeCompare(b.projectName, 'zh-Hans');
    return b.businessAmount - a.businessAmount;
  });
}

function splitRevenueSalesItemAmount(total: { sales: number; refund: number; storedBalance: number; actualRevenue: number }, weights: number[]) {
  let usedSales = 0;
  let usedRefund = 0;
  let usedStoredBalance = 0;
  let usedActualRevenue = 0;
  return weights.map((weight, index) => {
    const isLast = index === weights.length - 1;
    const amount = {
      sales: isLast ? total.sales - usedSales : Math.round(total.sales * weight),
      refund: isLast ? total.refund - usedRefund : Math.round(total.refund * weight),
      storedBalance: isLast ? total.storedBalance - usedStoredBalance : Math.round(total.storedBalance * weight),
      actualRevenue: isLast ? total.actualRevenue - usedActualRevenue : Math.round(total.actualRevenue * weight),
    };
    usedSales += amount.sales;
    usedRefund += amount.refund;
    usedStoredBalance += amount.storedBalance;
    usedActualRevenue += amount.actualRevenue;
    return amount;
  });
}

function summarizePrepaidRows(rows: RevenuePrepaidRow[]) {
  return rows.reduce(
    (acc, row) => ({
      sales: acc.sales + row.sales,
      refund: acc.refund + row.refund,
      netAmount: acc.netAmount + row.netAmount,
      orders: acc.orders + row.orders,
    }),
    { sales: 0, refund: 0, netAmount: 0, orders: 0 },
  );
}

function summarizeSalesItemRows(rows: RevenueSalesItemRow[]) {
  return rows.reduce(
    (acc, row) => ({
      sales: acc.sales + row.sales,
      refund: acc.refund + row.refund,
      actualRevenue: acc.actualRevenue + row.actualRevenue,
      storedBalance: acc.storedBalance + row.storedBalance,
      thirdPartyGroup: acc.thirdPartyGroup + row.thirdPartyGroup,
      businessAmount: acc.businessAmount + row.businessAmount,
    }),
    { sales: 0, refund: 0, actualRevenue: 0, storedBalance: 0, thirdPartyGroup: 0, businessAmount: 0 },
  );
}

function getRevenueSalesItemName(order: RevenueOrder) {
  const itemNames: Record<Project, string[]> = {
    venue: ['羽毛球馆订场', '篮球馆订场'],
    storedCard: ['储值卡销售', '余额充值'],
    courseCard: ['少儿羽毛球 10 课时', '成人私教 8 课时', '篮球基础班 12 课时'],
    passCard: ['自助训练月卡', '自助训练季卡', '羽毛球 10 次卡'],
    goods: ['商品销售（含快捷收款）'],
  };
  const index = Math.abs(order.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % itemNames[order.project].length;
  return itemNames[order.project][index];
}

function getRevenueSalesProjectName(project: Project, itemName: string) {
  if (project === 'storedCard' && itemName === '余额充值') return '余额充值';
  if (project === 'storedCard' && itemName === '储值卡销售') return '储值卡销售';
  return projectMeta[project].name;
}

function SettlementReconciliationPanel({ orders }: { orders: RevenueOrder[] }) {
  const [activeTab, setActiveTab] = useState<'collection' | 'account'>('collection');
  const totals = summarize(orders);
  const groupDefinitions = [
    {
      key: 'platform',
      title: '平台收款',
      helper: '可在商户后台核对资金入账',
      tone: 'blue',
      payments: ['payCode', 'wechat'] as Payment[],
      details: [
        { label: '收银台下单（商户扫码+用户扫码）', payment: 'payCode' as Payment },
        { label: '小程序收款', payment: 'wechat' as Payment },
      ],
    },
    {
      key: 'merchant',
      title: '商户自行收款',
      helper: '收银台下单，资金入账由商户自行核对',
      tone: 'emerald',
      payments: ['corporate', 'offline'] as Payment[],
      details: [
        { label: '收银台下单（对公转账）', payment: 'corporate' as Payment },
        { label: '收银台下单（线下付款）', payment: 'offline' as Payment },
      ],
    },
    {
      key: 'thirdParty',
      title: '第三方团购',
      helper: '团购核销金额，补贴券、退款需自行前往团购平台核对',
      tone: 'amber',
      payments: ['meituanGroup', 'douyinGroup'] as Payment[],
      details: [
        { label: '美团核销', payment: 'meituanGroup' as Payment },
        { label: '抖音核销', payment: 'douyinGroup' as Payment },
      ],
    },
  ];
  const settlementRows = groupDefinitions.map((group) => {
    const groupTotal = summarize(orders.filter((order) => group.payments.includes(order.payment)));
    return { ...group, total: groupTotal, netAmount: group.key === 'thirdParty' ? groupTotal.thirdPartyGroup : Math.max(groupTotal.channelAmount - groupTotal.refund, 0) };
  });
  const platformNet = settlementRows.find((row) => row.key === 'platform')?.netAmount ?? 0;
  const merchantNet = settlementRows.find((row) => row.key === 'merchant')?.netAmount ?? 0;
  const thirdPartyNet = settlementRows.find((row) => row.key === 'thirdParty')?.netAmount ?? 0;
  const platformRevenue = summarize(orders.filter(isPlatformRevenueOrder)).actualRevenue;
  const prepaidNet = summarize(orders.filter((order) => order.project === 'storedCard')).sales - summarize(orders.filter((order) => order.project === 'storedCard')).refund;
  const accountRows = buildPlatformAccountRows(orders);

  return (
    <Panel title="收款归集与对账" icon={Wallet}>
      <div className="mb-3 inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
        {[
          { key: 'collection', label: '收款归集' },
          { key: 'account', label: '账户对账' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveTab(item.key as typeof activeTab)}
            className={cn('rounded px-4 py-2 text-sm font-black transition', activeTab === item.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === 'collection' ? (
      <>
      <div className="grid gap-3 xl:grid-cols-3">
        {settlementRows.map((group) => {
          const toneClass = group.tone === 'blue' ? 'border-blue-100 bg-blue-50/60 text-blue-800' : group.tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/60 text-emerald-800' : 'border-amber-100 bg-amber-50/70 text-amber-800';

          return (
            <div key={group.key} className={cn('rounded-lg border p-3.5', toneClass)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black">{group.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black tracking-normal">{money(group.netAmount)}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {group.details.map((detail) => {
                  const detailTotal = summarize(orders.filter((order) => order.payment === detail.payment));
                  const detailNet = group.key === 'thirdParty' ? detailTotal.thirdPartyGroup : Math.max(detailTotal.channelAmount - detailTotal.refund, 0);
                  return (
                    <div key={detail.payment} className="flex items-center justify-between gap-2 rounded-md bg-white/70 px-2.5 py-2 text-xs font-bold">
                      <span className="min-w-0 truncate">{detail.label}</span>
                      <span className="shrink-0 tabular-nums">{money(detailNet)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[11px] font-semibold leading-5 opacity-75">{group.helper}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs font-bold leading-5 text-slate-600">
        平台收款 {money(platformNet)} + 商户自行收款 {money(merchantNet)} = 平台营收 {money(platformRevenue)} + 储值卡/余额净收款金额 {money(prepaidNet)}
      </div>

      </>
      ) : (
        <AccountReconciliationTable rows={accountRows} />
      )}
    </Panel>
  );
}

function AccountReconciliationTable({ rows }: { rows: PlatformAccountRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">场馆名称</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">收款渠道</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">收款账户</th>
              <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">收款金额</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.venueName + row.accountName} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{row.venueName}</td>
                <td className="border-b border-slate-100 px-3 py-3">{row.channels.join(' + ')}</td>
                <td className="border-b border-slate-100 px-3 py-3">{row.accountName}</td>
                <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.amount)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 text-sm font-black text-slate-900">
              <td className="border-t border-slate-200 px-3 py-3" colSpan={3}>合计</td>
              <td className="border-t border-slate-200 px-3 py-3 text-right tabular-nums text-blue-700">{money(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PlatformAccountRow = {
  venueName: string;
  accountName: string;
  channels: string[];
  amount: number;
};

function buildPlatformAccountRows(orders: RevenueOrder[]): PlatformAccountRow[] {
  const accountConfig: Record<Exclude<StoreId, 'all'>, Partial<Record<'miniProgram' | 'cashier', { venueName: string; accountName: string }>>> = {
    north: {
      miniProgram: { venueName: '湖滨旗舰店', accountName: '湖滨旗舰店收款账户A' },
      cashier: { venueName: '湖滨旗舰店', accountName: '湖滨旗舰店收款账户B' },
    },
    river: {
      miniProgram: { venueName: '江湾训练馆', accountName: '江湾训练馆收款账户' },
      cashier: { venueName: '江湾训练馆', accountName: '江湾训练馆收款账户' },
    },
    east: {
      miniProgram: { venueName: '东城综合馆', accountName: '东城综合馆收款账户' },
      cashier: { venueName: '东城综合馆', accountName: '东城综合馆收款账户' },
    },
    softB: {},
    softF: {},
    huaqiao: {},
    jiageng: {},
    lvcuo: {},
    dihao: {},
    sibei: {},
    xianglu: {},
    wanda: {},
  };
  const channelName: Record<'miniProgram' | 'cashier', string> = { miniProgram: '小程序', cashier: '收银台' };
  const grouped = new Map<string, PlatformAccountRow>();

  (Object.keys(accountConfig) as Exclude<StoreId, 'all'>[]).forEach((store) => {
    (Object.keys(accountConfig[store]) as ('miniProgram' | 'cashier')[]).forEach((source) => {
      const config = accountConfig[store][source];
      if (!config) return;
      const key = store + '|' + config.venueName + '|' + config.accountName;
      const current = grouped.get(key) ?? { venueName: config.venueName, accountName: config.accountName, channels: [], amount: 0 };
      if (!current.channels.includes(channelName[source])) current.channels.push(channelName[source]);
      grouped.set(key, current);
    });
  });

  orders
    .filter((order) => order.payment === 'wechat' || order.payment === 'payCode')
    .forEach((order) => {
      const source = order.source === 'miniProgram' ? 'miniProgram' : 'cashier';
      const config = accountConfig[order.store][source];
      if (!config) return;
      const key = order.store + '|' + config.venueName + '|' + config.accountName;
      const current = grouped.get(key);
      if (!current) return;
      current.amount += Math.max(order.paid - (order.refund ?? 0), 0);
    });

  return Array.from(grouped.values())
    .filter((row) => row.amount > 0)
    .sort((a, b) => a.venueName.localeCompare(b.venueName, 'zh-Hans') || a.accountName.localeCompare(b.accountName, 'zh-Hans'));
}

const projectBreakdownMeta: Record<string, { name: string; color: string; icon: typeof Store }> = {
  storedCard: { name: '储值卡销售', color: 'bg-blue-500', icon: Wallet },
  balanceRecharge: { name: '余额充值', color: 'bg-sky-500', icon: Wallet },
};

function splitStoredCardProjectRows(rows: { key: string; total: ReturnType<typeof summarize> }[]) {
  return rows.flatMap((row) => {
    if (row.key !== 'storedCard') return [row];
    const [storedCardTotal, balanceTotal] = splitSummaryTotal(row.total, [0.68, 0.32]);
    return [
      { key: 'storedCard', total: storedCardTotal },
      { key: 'balanceRecharge', total: balanceTotal },
    ];
  });
}

function splitSummaryTotal(total: ReturnType<typeof summarize>, weights: number[]) {
  const keys = Object.keys(total) as (keyof ReturnType<typeof summarize>)[];
  const used = Object.fromEntries(keys.map((key) => [key, 0])) as ReturnType<typeof summarize>;

  return weights.map((weight, index) => {
    const isLast = index === weights.length - 1;
    const item = { ...summarize([]) };
    keys.forEach((key) => {
      const value = isLast ? total[key] - used[key] : Math.round(total[key] * weight);
      item[key] = value;
      used[key] += value;
    });
    return item;
  });
}

function RevenuePrepaidSummaryTable({ rows }: { rows: RevenuePrepaidRow[] }) {
  const total = summarizePrepaidRows(rows);

  return (
    <Panel title="预收款构成" icon={Wallet}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="w-[240px] border-b border-slate-100 py-3 pr-3 text-left">预收项目</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">新售卡/充值金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">退款金额</th>
              <th className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right text-emerald-700">净收款金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">订单数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 py-3 pr-3"><RowName rowKey={row.key} type="project" /></td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.sales)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600">{money(row.refund)}</td>
                <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right font-black tabular-nums text-emerald-700">{money(row.netAmount)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.orders}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 text-sm font-black text-slate-900">
              <td className="border-b border-slate-100 py-3 pr-3">合计</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(total.sales)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600">{money(total.refund)}</td>
              <td className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right tabular-nums text-emerald-700">{money(total.netAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.orders}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RevenueBreakdownTable({ title, rows, type, total }: {
  title: string;
  rows: { key: string; total: ReturnType<typeof summarizeRevenueComposition> }[];
  type: 'project' | 'sport' | 'source';
  total: number;
}) {
  const tableTotal = summarizeRevenueCompositionTotals(rows.map((row) => row.total));

  return (
    <Panel title={title} icon={type === 'source' || type === 'sport' ? Store : BarChart3}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="w-[220px] border-b border-slate-100 py-3 pr-3 text-left">{type === 'project' ? '销售项目' : type === 'sport' ? '运动项目' : '销售渠道'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">平台销售额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">平台退款额</th>
              <th className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right text-blue-700">平台营收金额</th>
              <th className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right text-emerald-700">储值卡/余额支付</th>
              <th className="border-b border-slate-100 bg-amber-50/60 px-3 py-3 text-right text-amber-700">第三方团购核销</th>
              <th className="border-b border-slate-100 bg-slate-100 px-3 py-3 text-right text-slate-800">经营发生额</th>
              <th className="w-[120px] border-b border-slate-100 py-3 pl-3 text-right">占比</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const percent = total > 0 ? (row.total.businessAmount / total) * 100 : 0;
              return (
                <tr key={row.key} className="font-bold text-slate-800">
                  <td className="border-b border-slate-100 py-3 pr-3">
                    <RowName rowKey={row.key} type={type} />
                    {type === 'source' && row.key === 'cashier' && <div className="mt-1 text-xs font-bold text-slate-400">含商户扫码、用户扫码、线下付款、对公转账</div>}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.sales)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600">{money(row.total.refund)}</td>
                  <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.total.actualRevenue)}</td>
                  <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.total.storedBalance)}</td>
                  <td className="border-b border-slate-100 bg-amber-50/40 px-3 py-3 text-right tabular-nums text-amber-700">{money(row.total.thirdPartyGroup)}</td>
                  <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right font-black tabular-nums text-slate-900">{money(row.total.businessAmount)}</td>
                  <td className="border-b border-slate-100 py-3 pl-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="w-12 text-xs font-black tabular-nums text-slate-500">{percent.toFixed(1)}%</span>
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                        <span className="block h-full rounded-full bg-slate-500" style={{ width: Math.min(Math.max(percent, 0), 100) + '%' }} />
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 text-sm font-black text-slate-900">
              <td className="border-b border-slate-100 py-3 pr-3">合计</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(tableTotal.sales)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600">{money(tableTotal.refund)}</td>
              <td className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right tabular-nums text-blue-700">{money(tableTotal.actualRevenue)}</td>
              <td className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right tabular-nums text-emerald-700">{money(tableTotal.storedBalance)}</td>
              <td className="border-b border-slate-100 bg-amber-50/60 px-3 py-3 text-right tabular-nums text-amber-700">{money(tableTotal.thirdPartyGroup)}</td>
              <td className="border-b border-slate-100 bg-slate-100 px-3 py-3 text-right tabular-nums">{money(tableTotal.businessAmount)}</td>
              <td className="border-b border-slate-100 py-3 pl-3 text-right text-xs text-slate-500">100.0%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function FinancialSummaryPanel({
  title,
  rows,
  type,
  total,
  caption,
}: {
  title: string;
  rows: { key: string; total: ReturnType<typeof summarize> }[];
  type: 'project' | 'sport' | 'source' | 'payment';
  total: number;
  caption?: ReactNode;
}) {
  const colors = ['#e96a7a', '#a855f7', '#60a5fa', '#22c55e', '#f59e0b', '#94a3b8'];
  const valueForRow = (row: { total: ReturnType<typeof summarize> }) => (type === 'project' || type === 'sport' || type === 'source' ? row.total.actualRevenue : row.total.channelAmount);
  const values = rows.map((row) => Math.max(valueForRow(row), 0));
  const sum = values.reduce((acc, value) => acc + value, 0);
  const denominator = total > 0 ? total : sum;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <Panel title={title} icon={type === 'payment' ? Wallet : type === 'source' || type === 'sport' ? Store : BarChart3} action={caption}>
      <div className={cn('grid items-center gap-3', type === 'project' ? 'md:grid-cols-[160px_1fr]' : 'md:grid-cols-[180px_1fr]')}>
        <div className="relative mx-auto h-44 w-44">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef2f7" strokeWidth="20" />
            {rows.map((row, index) => {
              const value = values[index];
              const length = sum > 0 ? (value / sum) * circumference : 0;
              const segmentOffset = offset;
              offset += length;

              return (
                <circle
                  key={row.key}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth="20"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-segmentOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xl font-black tracking-normal text-slate-900">{money(sum)}</div>
            <div className="mt-1 text-[11px] font-bold text-slate-400">{type === 'project' || type === 'sport' || type === 'source' ? '平台营收金额' : '核对金额'}</div>
          </div>
        </div>
        <div className="space-y-2.5">
          {rows.map((row, index) => {
            const value = values[index];
            const percent = denominator > 0 ? ((value / denominator) * 100).toFixed(1) + '%' : '0.0%';
            return (
              <div key={row.key} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <div className="min-w-0 flex-1">
                  <div className="min-w-0 text-sm font-black text-slate-700">
                    <RowName rowKey={row.key} type={type} compact />
                  </div>
                  {type === 'source' && row.key === 'cashier' && <div className="mt-0.5 text-xs font-bold text-slate-400">含商户扫码、用户扫码、线下付款、对公转账</div>}
                  {type === 'project' || type === 'sport' || type === 'source' ? (
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-bold xl:grid-cols-4">
                      <SummaryMiniStat label="平台销售额" value={money(row.total.sales)} tone="slate" />
                      <SummaryMiniStat label="平台退款额" value={money(row.total.refund)} tone={row.total.refund > 0 ? 'amber' : 'muted'} />
                      <SummaryMiniStat label="平台营收金额" value={money(row.total.actualRevenue)} tone="slate" />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold">
                      <span className="tabular-nums text-slate-900">{money(value)}</span>
                      <span className="text-xs text-slate-400">占比 {percent}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}


type CourseType = 'all' | 'private' | 'small' | 'group';
type CoachId = 'all' | 'chen' | 'lin' | 'zhou' | 'wu';

type CourseStat = {
  id: string;
  venue: Exclude<StoreId, 'all'>;
  coach: Exclude<CoachId, 'all'>;
  courseType: Exclude<CourseType, 'all'>;
  completedHours: number;
  completedAmount: number;
  pendingHours: number;
  cancelledHours: number;
  soldHours: number;
  soldAmount: number;
  remainingHours: number;
  frequency: number;
};

const coachOptions = [
  { id: 'all', name: '全部教练' },
  { id: 'chen', name: '陈教练' },
  { id: 'lin', name: '林教练' },
  { id: 'zhou', name: '周教练' },
  { id: 'wu', name: '吴教练' },
] satisfies { id: CoachId; name: string }[];

const courseTypeOptions = [
  { id: 'all', name: '全部课程' },
  { id: 'private', name: '私教课' },
  { id: 'small', name: '小班课' },
  { id: 'group', name: '团课' },
] satisfies { id: CourseType; name: string }[];

const courseTypeMeta = {
  private: { name: '私教课', color: '#e96a7a' },
  small: { name: '小班课', color: '#a855f7' },
  group: { name: '团课', color: '#60a5fa' },
} satisfies Record<Exclude<CourseType, 'all'>, { name: string; color: string }>;

const courseStats: CourseStat[] = [
  { id: 'C001', venue: 'north', coach: 'chen', courseType: 'private', completedHours: 42, completedAmount: 33600, pendingHours: 12, cancelledHours: 3, soldHours: 126, soldAmount: 100800, remainingHours: 84, frequency: 36 },
  { id: 'C002', venue: 'north', coach: 'chen', courseType: 'small', completedHours: 28, completedAmount: 11200, pendingHours: 8, cancelledHours: 2, soldHours: 88, soldAmount: 35200, remainingHours: 60, frequency: 19 },
  { id: 'C003', venue: 'river', coach: 'lin', courseType: 'private', completedHours: 35, completedAmount: 28000, pendingHours: 10, cancelledHours: 4, soldHours: 98, soldAmount: 78400, remainingHours: 63, frequency: 31 },
  { id: 'C004', venue: 'river', coach: 'lin', courseType: 'group', completedHours: 24, completedAmount: 7200, pendingHours: 6, cancelledHours: 1, soldHours: 76, soldAmount: 22800, remainingHours: 52, frequency: 12 },
  { id: 'C005', venue: 'east', coach: 'zhou', courseType: 'small', completedHours: 32, completedAmount: 12800, pendingHours: 9, cancelledHours: 3, soldHours: 92, soldAmount: 36800, remainingHours: 60, frequency: 22 },
  { id: 'C006', venue: 'east', coach: 'zhou', courseType: 'group', completedHours: 26, completedAmount: 7800, pendingHours: 5, cancelledHours: 2, soldHours: 64, soldAmount: 19200, remainingHours: 38, frequency: 14 },
  { id: 'C007', venue: 'north', coach: 'wu', courseType: 'private', completedHours: 30, completedAmount: 24000, pendingHours: 7, cancelledHours: 2, soldHours: 86, soldAmount: 68800, remainingHours: 56, frequency: 27 },
  { id: 'C008', venue: 'river', coach: 'wu', courseType: 'small', completedHours: 20, completedAmount: 8000, pendingHours: 4, cancelledHours: 1, soldHours: 60, soldAmount: 24000, remainingHours: 40, frequency: 15 },
];

const monthlyCourseFrequency = [
  { month: '01月', frequency: 86, completedHours: 132, amount: 51800 },
  { month: '02月', frequency: 92, completedHours: 148, amount: 57200 },
  { month: '03月', frequency: 108, completedHours: 166, amount: 64100 },
  { month: '04月', frequency: 121, completedHours: 184, amount: 71600 },
  { month: '05月', frequency: 118, completedHours: 178, amount: 69200 },
  { month: '06月', frequency: 136, completedHours: 212, amount: 82600 },
];


type CourseProductRow = {
  courseType: Exclude<CourseType, 'all'>;
  name: string;
  soldHours: number;
  soldAmount: number;
  completedHours: number;
  completedAmount: number;
  remainingHours: number;
};

const courseProductRows: CourseProductRow[] = [
  { courseType: 'private', name: '\u79c1\u6559\u5305\u5b63', soldHours: 138, soldAmount: 118800, completedHours: 54, completedAmount: 46400, remainingHours: 84 },
  { courseType: 'private', name: '1V1\u79c1\u6559\u5305\u6708', soldHours: 116, soldAmount: 92800, completedHours: 44, completedAmount: 35200, remainingHours: 72 },
  { courseType: 'private', name: '1V2\u79c1\u6559\u5305\u6708', soldHours: 82, soldAmount: 57400, completedHours: 36, completedAmount: 25200, remainingHours: 46 },
  { courseType: 'private', name: '1V3\u79c1\u6559\u5305\u6708', soldHours: 60, soldAmount: 36000, completedHours: 28, completedAmount: 16800, remainingHours: 32 },
  { courseType: 'private', name: '3\u8282\u79c1\u6559', soldHours: 34, soldAmount: 20400, completedHours: 18, completedAmount: 10800, remainingHours: 16 },
  { courseType: 'small', name: '\u5c0f\u73ed\u57fa\u7840\u8bfe', soldHours: 92, soldAmount: 36800, completedHours: 38, completedAmount: 15200, remainingHours: 54 },
  { courseType: 'small', name: '\u5c0f\u73ed\u63d0\u9ad8\u8bfe', soldHours: 78, soldAmount: 34320, completedHours: 34, completedAmount: 14960, remainingHours: 44 },
  { courseType: 'small', name: '\u9752\u5c11\u5e74\u5c0f\u73ed\u8bfe', soldHours: 72, soldAmount: 31680, completedHours: 31, completedAmount: 13640, remainingHours: 41 },
  { courseType: 'small', name: '\u6691\u671f\u8bad\u7ec3\u8425', soldHours: 64, soldAmount: 28800, completedHours: 25, completedAmount: 11250, remainingHours: 39 },
  { courseType: 'small', name: '\u5468\u672b\u5c0f\u73ed\u8bfe', soldHours: 48, soldAmount: 19200, completedHours: 20, completedAmount: 8000, remainingHours: 28 },
  { courseType: 'group', name: '\u6210\u4eba\u7fbd\u6bdb\u7403\u56e2\u8bfe', soldHours: 86, soldAmount: 25800, completedHours: 34, completedAmount: 10200, remainingHours: 52 },
  { courseType: 'group', name: '\u9752\u5c11\u5e74\u56e2\u8bfe', soldHours: 78, soldAmount: 23400, completedHours: 31, completedAmount: 9300, remainingHours: 47 },
  { courseType: 'group', name: '\u96f6\u57fa\u7840\u56e2\u8bfe', soldHours: 66, soldAmount: 19800, completedHours: 27, completedAmount: 8100, remainingHours: 39 },
  { courseType: 'group', name: '\u8fdb\u9636\u56e2\u8bfe', soldHours: 58, soldAmount: 18560, completedHours: 26, completedAmount: 8320, remainingHours: 32 },
  { courseType: 'group', name: '\u4f53\u80fd\u8bad\u7ec3\u56e2\u8bfe', soldHours: 44, soldAmount: 13200, completedHours: 18, completedAmount: 5400, remainingHours: 26 },
];

function CourseTrainingReport({ period, customRange, onPeriodChange, onCustomRangeChange }: { period: Period; customRange: CustomDateRange; onPeriodChange: (period: Period) => void; onCustomRangeChange: (range: CustomDateRange) => void }) {
  const [venue, setVenue] = useState<StoreId>('all');
  const activePeriod = periods.find((item) => item.id === period)!;
  const filtered = useMemo(() => courseStats.filter((item) => venue === 'all' || item.venue === venue), [venue]);
  const totals = useMemo(() => summarizeCourseStats(filtered), [filtered]);
  const salesRows = useMemo(() => buildCourseSalesAnalysisRows(filtered), [filtered]);
  const consumptionRows = useMemo(() => buildCourseConsumptionRows(filtered), [filtered]);
  const coachRows = useMemo(() => buildCourseCoachRows(filtered), [filtered]);
  const refundRows = useMemo(() => buildCourseRefundRows(filtered), [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <Segmented value={period} customRange={customRange} onChange={onPeriodChange} onCustomRangeChange={onCustomRangeChange} />
          <div className="mt-1.5 text-xs font-semibold text-slate-500">统计区间：{activePeriod.range}</div>
        </div>
        <SelectBox icon={Building2} value={venue} onChange={(value) => setVenue(value as StoreId)} options={stores} />
      </div>

      <CourseAssetOverview totals={totals} range={activePeriod.range} />

      <CourseSalesAnalysisPanel rows={salesRows} />
      <CourseConsumptionAnalysisPanel totals={totals} courseRows={consumptionRows} coachRows={coachRows} />
      <CourseRefundAnalysisPanel rows={refundRows} />

      <KeyMetricNotes
        items={[
          '课程经营概览按顶部门店和时间筛选汇总，只呈现售课、消课、待履约三个大方向。',
          '课程培训报表按课程经营发生口径统计，包含平台售课、储值卡/余额支付消课权益，以及美团、抖音等第三方团购核销形成的课程权益。',
          '售课分析仅统计区间内交易成功且未退款的课程订单；销售渠道仅做结构分析，不拆分明细行。',
          '消课课时指统计区间内已完成上课并扣减会员课时余额的课时；待上课课时指已预约排课但尚未完成上课的课时。',
          '待履约为截至统计区间结束日的课程余额快照，不等同于区间发生额。',
          '退款分析按退款发生时间计入统计区间，可能对应历史售课订单，不冲减售课分析。',
        ]}
      />
    </div>
  );
}

type CourseSalesAnalysisRow = {
  venue: Exclude<StoreId, 'all'>;
  courseType: Exclude<CourseType, 'all'>;
  courseName: string;
  soldHours: number;
  soldAmount: number;
  orderCount: number;
};

type CourseConsumptionAnalysisRow = {
  venue: Exclude<StoreId, 'all'>;
  courseType: Exclude<CourseType, 'all'>;
  courseName: string;
  coach: Exclude<CoachId, 'all'>;
  completedHours: number;
  completedAmount: number;
  studentCount: number;
  pendingHours: number;
};

type CourseCoachAnalysisRow = {
  venue: Exclude<StoreId, 'all'>;
  coach: Exclude<CoachId, 'all'>;
  completedHours: number;
  completedAmount: number;
  studentCount: number;
  pendingHours: number;
  cancelledHours: number;
};

type CourseRefundAnalysisRow = {
  venue: Exclude<StoreId, 'all'>;
  courseType: Exclude<CourseType, 'all'>;
  courseName: string;
  refundHours: number;
  refundAmount: number;
  refundCount: number;
};

function CourseSalesAnalysisPanel({ rows }: { rows: CourseSalesAnalysisRow[] }) {
  const total = rows.reduce((acc, row) => ({ soldHours: acc.soldHours + row.soldHours, soldAmount: acc.soldAmount + row.soldAmount, orderCount: acc.orderCount + row.orderCount }), { soldHours: 0, soldAmount: 0, orderCount: 0 });
  const sourceRows = buildCourseSalesSourceRows(total);
  const typeRows = buildCourseSalesTypeRows(rows);

  return (
    <Panel title="售课分析" icon={TicketCheck}>
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <MiniStat label="成交售课金额" value={money(total.soldAmount)} />
        <MiniStat label="成交售课课时" value={String(total.soldHours) + '课时'} />
        <MiniStat label="成交订单数" value={String(total.orderCount) + '单'} />
      </div>
      <div className="mb-3 grid gap-3 xl:grid-cols-2">
        <CourseSalesDonut title="销售渠道" rows={sourceRows} totalAmount={total.soldAmount} />
        <CourseSalesDonut title="课程类型" rows={typeRows} totalAmount={total.soldAmount} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">门店</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">课程名称</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">课程类型</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">售课课时</th>
              <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">售课金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">成交订单数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.venue + row.courseName} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{storeName(row.venue)}</td>
                <td className="border-b border-slate-100 px-3 py-3">{row.courseName}</td>
                <td className="border-b border-slate-100 px-3 py-3">{courseTypeDisplayName(row.courseType)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.soldHours}</td>
                <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.soldAmount)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.orderCount}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-black text-slate-900">
              <td className="border-b border-slate-100 px-3 py-3" colSpan={3}>合计</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.soldHours}</td>
              <td className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right tabular-nums text-blue-700">{money(total.soldAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.orderCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function CourseSalesDonut({ title, rows, totalAmount }: { title: string; rows: { key: string; amount: number; hours: number }[]; totalAmount: number }) {
  const colors = ['#2563eb', '#0ea5e9', '#f59e0b', '#d946ef', '#22c55e', '#6366f1'];
  const sum = rows.reduce((acc, row) => acc + row.amount, 0);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="mb-2 text-sm font-black text-slate-800">{title}</div>
      <div className="grid items-center gap-3 md:grid-cols-[150px_1fr]">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="16" />
            {rows.map((row, index) => {
              const length = sum > 0 ? (row.amount / sum) * circumference : 0;
              const segmentOffset = offset;
              offset += length;
              return (
                <circle
                  key={row.key}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth="16"
                  strokeDasharray={String(length) + ' ' + String(circumference - length)}
                  strokeDashoffset={-segmentOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-slate-400">合计</div>
            <div className="mt-0.5 text-base font-black tracking-normal text-slate-900">{money(sum)}</div>
          </div>
        </div>
        <div className="space-y-2">
          {rows.map((row, index) => {
            const share = totalAmount > 0 ? ((row.amount / totalAmount) * 100).toFixed(1) + '%' : '0.0%';
            return (
              <div key={row.key} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-slate-700">{row.key}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs font-bold text-slate-500">
                    <span className="tabular-nums text-slate-900">{money(row.amount)}</span>
                    <span>{row.hours}课时</span>
                    <span>占比 {share}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildCourseSalesSourceRows(total: { soldAmount: number; soldHours: number }) {
  const sources = [
    { key: '小程序', weight: 0.34 },
    { key: '收银台', weight: 0.26 },
    { key: '美团核销', weight: 0.22 },
    { key: '抖音核销', weight: 0.18 },
  ];
  return distributeCourseSales(total, sources);
}

function buildCourseSalesTypeRows(rows: CourseSalesAnalysisRow[]) {
  const grouped = new Map<string, { soldAmount: number; soldHours: number }>();
  rows.forEach((row) => {
    const key = courseTypeDisplayName(row.courseType);
    const current = grouped.get(key) ?? { soldAmount: 0, soldHours: 0 };
    current.soldAmount += row.soldAmount;
    current.soldHours += row.soldHours;
    grouped.set(key, current);
  });
  return Array.from(grouped.entries())
    .map(([key, value]) => ({ key, amount: value.soldAmount, hours: value.soldHours }))
    .sort((a, b) => b.amount - a.amount);
}

function distributeCourseSales(total: { soldAmount: number; soldHours: number }, rows: { key: string; weight: number }[]) {
  let usedAmount = 0;
  let usedHours = 0;
  return rows.map((row, index) => {
    const isLast = index === rows.length - 1;
    const amount = isLast ? Math.max(total.soldAmount - usedAmount, 0) : Math.round(total.soldAmount * row.weight);
    const hours = isLast ? Math.max(total.soldHours - usedHours, 0) : Math.round(total.soldHours * row.weight);
    usedAmount += amount;
    usedHours += hours;
    return { key: row.key, amount, hours };
  });
}

function CourseConsumptionAnalysisPanel({ totals, courseRows, coachRows }: { totals: CourseSummary; courseRows: CourseConsumptionAnalysisRow[]; coachRows: CourseCoachAnalysisRow[] }) {
  const [tab, setTab] = useState<'course' | 'coach'>('course');
  const studentRows = buildStudentFrequencyRows(totals);
  const totalStudents = studentRows.reduce((sum, row) => sum + row.count, 0);

  return (
    <Panel title="消课分析" icon={BarChart3}>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="上课学员数" value={String(totalStudents) + '人'} />
        <MiniStat label="消课课时" value={String(totals.completedHours) + '课时'} />
        <MiniStat label="消课金额" value={money(totals.completedAmount)} />
        <MiniStat label="待上课课时" value={String(totals.pendingHours) + '课时'} />
        <MiniStat label="已取消课时" value={String(totals.cancelledHours) + '课时'} />
      </div>
      <div className="mb-3 flex rounded-md bg-slate-100 p-1">
        {[
          { id: 'course', name: '按课程分析' },
          { id: 'coach', name: '按教练分析' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as 'course' | 'coach')}
            className={cn('h-9 rounded px-4 text-sm font-black', tab === item.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800')}
          >
            {item.name}
          </button>
        ))}
      </div>
      {tab === 'course' ? <CourseConsumptionByCourseTable rows={courseRows} /> : <CourseConsumptionByCoachTable rows={coachRows} />}
    </Panel>
  );
}

function CourseConsumptionByCourseTable({ rows }: { rows: CourseConsumptionAnalysisRow[] }) {
  const total = rows.reduce((acc, row) => ({ completedHours: acc.completedHours + row.completedHours, completedAmount: acc.completedAmount + row.completedAmount, studentCount: acc.studentCount + row.studentCount, pendingHours: acc.pendingHours + row.pendingHours }), { completedHours: 0, completedAmount: 0, studentCount: 0, pendingHours: 0 });
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">门店</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">课程名称</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">课程类型</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">上课教练</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">消课课时</th>
            <th className="border-b border-slate-100 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">消课金额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">上课学员数</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">待上课课时</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.venue + row.courseName + row.coach} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{storeName(row.venue)}</td>
              <td className="border-b border-slate-100 px-3 py-3">{row.courseName}</td>
              <td className="border-b border-slate-100 px-3 py-3">{courseTypeDisplayName(row.courseType)}</td>
              <td className="border-b border-slate-100 px-3 py-3">{coachName(row.coach)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.completedHours}</td>
              <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.completedAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.studentCount}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.pendingHours}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-black text-slate-900">
            <td className="border-b border-slate-100 px-3 py-3" colSpan={4}>合计</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.completedHours}</td>
            <td className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right tabular-nums text-emerald-700">{money(total.completedAmount)}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.studentCount}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.pendingHours}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CourseConsumptionByCoachTable({ rows }: { rows: CourseCoachAnalysisRow[] }) {
  const total = rows.reduce((acc, row) => ({ completedHours: acc.completedHours + row.completedHours, completedAmount: acc.completedAmount + row.completedAmount, studentCount: acc.studentCount + row.studentCount, pendingHours: acc.pendingHours + row.pendingHours, cancelledHours: acc.cancelledHours + row.cancelledHours }), { completedHours: 0, completedAmount: 0, studentCount: 0, pendingHours: 0, cancelledHours: 0 });
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">门店</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">教练</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">消课课时</th>
            <th className="border-b border-slate-100 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">消课金额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">上课学员数</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">待上课课时</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">已取消课时</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.venue + row.coach} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{storeName(row.venue)}</td>
              <td className="border-b border-slate-100 px-3 py-3">{coachName(row.coach)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.completedHours}</td>
              <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.completedAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.studentCount}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.pendingHours}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.cancelledHours}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-black text-slate-900">
            <td className="border-b border-slate-100 px-3 py-3" colSpan={2}>合计</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.completedHours}</td>
            <td className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right tabular-nums text-emerald-700">{money(total.completedAmount)}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.studentCount}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.pendingHours}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.cancelledHours}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CourseRefundAnalysisPanel({ rows }: { rows: CourseRefundAnalysisRow[] }) {
  const total = rows.reduce((acc, row) => ({ refundHours: acc.refundHours + row.refundHours, refundAmount: acc.refundAmount + row.refundAmount, refundCount: acc.refundCount + row.refundCount }), { refundHours: 0, refundAmount: 0, refundCount: 0 });

  return (
    <Panel title="退款分析" icon={ReceiptText}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">门店</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">课程名称</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">课程类型</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">退款课时</th>
              <th className="border-b border-slate-100 bg-rose-50/50 px-3 py-3 text-right text-rose-700">退款金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">退款笔数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.venue + row.courseName} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{storeName(row.venue)}</td>
                <td className="border-b border-slate-100 px-3 py-3">{row.courseName}</td>
                <td className="border-b border-slate-100 px-3 py-3">{courseTypeDisplayName(row.courseType)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.refundHours}</td>
                <td className="border-b border-slate-100 bg-rose-50/40 px-3 py-3 text-right tabular-nums text-rose-700">{money(row.refundAmount)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.refundCount}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-black text-slate-900">
              <td className="border-b border-slate-100 px-3 py-3" colSpan={3}>合计</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.refundHours}</td>
              <td className="border-b border-slate-100 bg-rose-50/60 px-3 py-3 text-right tabular-nums text-rose-700">{money(total.refundAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.refundCount}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function buildCourseSalesAnalysisRows(rows: CourseStat[]): CourseSalesAnalysisRow[] {
  return rows.map((row) => ({
    venue: row.venue,
    courseType: row.courseType,
    courseName: getCourseName(row),
    soldHours: row.soldHours,
    soldAmount: row.soldAmount,
    orderCount: Math.max(Math.round(row.soldHours / 8), 1),
  })).filter((row) => row.soldAmount > 0).sort((a, b) => storeName(a.venue).localeCompare(storeName(b.venue), 'zh-Hans') || b.soldAmount - a.soldAmount);
}

function buildCourseConsumptionRows(rows: CourseStat[]): CourseConsumptionAnalysisRow[] {
  return rows.map((row) => ({
    venue: row.venue,
    courseType: row.courseType,
    courseName: getCourseName(row),
    coach: row.coach,
    completedHours: row.completedHours,
    completedAmount: row.completedAmount,
    studentCount: Math.max(Math.round(row.frequency / 3), 1),
    pendingHours: row.pendingHours,
  })).filter((row) => row.completedAmount > 0 || row.completedHours > 0).sort((a, b) => storeName(a.venue).localeCompare(storeName(b.venue), 'zh-Hans') || b.completedAmount - a.completedAmount);
}

function buildCourseCoachRows(rows: CourseStat[]): CourseCoachAnalysisRow[] {
  const grouped = new Map<string, CourseCoachAnalysisRow>();
  rows.forEach((row) => {
    const key = row.venue + '|' + row.coach;
    const current = grouped.get(key) ?? { venue: row.venue, coach: row.coach, completedHours: 0, completedAmount: 0, studentCount: 0, pendingHours: 0, cancelledHours: 0 };
    current.completedHours += row.completedHours;
    current.completedAmount += row.completedAmount;
    current.studentCount += Math.max(Math.round(row.frequency / 3), 1);
    current.pendingHours += row.pendingHours;
    current.cancelledHours += row.cancelledHours;
    grouped.set(key, current);
  });
  return Array.from(grouped.values()).sort((a, b) => storeName(a.venue).localeCompare(storeName(b.venue), 'zh-Hans') || b.completedAmount - a.completedAmount);
}

function buildCourseRefundRows(rows: CourseStat[]): CourseRefundAnalysisRow[] {
  return rows
    .filter((row, index) => (index + row.soldHours + row.completedHours) % 3 === 0)
    .map((row) => {
      const refundHours = Math.max(Math.round(row.soldHours * 0.08), 1);
      const unitPrice = row.soldHours > 0 ? row.soldAmount / row.soldHours : 0;
      return {
        venue: row.venue,
        courseType: row.courseType,
        courseName: getCourseName(row),
        refundHours,
        refundAmount: Math.round(refundHours * unitPrice),
        refundCount: Math.max(Math.round(refundHours / 8), 1),
      };
    })
    .filter((row) => row.refundAmount > 0)
    .sort((a, b) => storeName(a.venue).localeCompare(storeName(b.venue), 'zh-Hans') || b.refundAmount - a.refundAmount);
}

function getCourseName(row: CourseStat) {
  const names: Record<Exclude<CourseType, 'all'>, string[]> = {
    private: ['1V1私教包月', '私教包季', '1V2私教包月'],
    small: ['青少年小班课', '小班基础课', '小班提高课'],
    group: ['成人团课', '周末团课', '暑期训练营'],
  };
  const index = Math.abs(row.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % names[row.courseType].length;
  return names[row.courseType][index];
}

function storeName(store: Exclude<StoreId, 'all'>) {
  return stores.find((item) => item.id === store)?.name ?? store;
}

function coachName(coach: Exclude<CoachId, 'all'>) {
  return coachOptions.find((item) => item.id === coach)?.name ?? coach;
}

type CourseSummary = {
  completedHours: number;
  completedAmount: number;
  pendingHours: number;
  cancelledHours: number;
  soldHours: number;
  soldAmount: number;
  remainingHours: number;
  frequency: number;
};

function summarizeCourseStats(rows: CourseStat[]): CourseSummary {
  return rows.reduce<CourseSummary>(
    (acc, row) => ({
      completedHours: acc.completedHours + row.completedHours,
      completedAmount: acc.completedAmount + row.completedAmount,
      pendingHours: acc.pendingHours + row.pendingHours,
      cancelledHours: acc.cancelledHours + row.cancelledHours,
      soldHours: acc.soldHours + row.soldHours,
      soldAmount: acc.soldAmount + row.soldAmount,
      remainingHours: acc.remainingHours + row.remainingHours,
      frequency: acc.frequency + row.frequency,
    }),
    { completedHours: 0, completedAmount: 0, pendingHours: 0, cancelledHours: 0, soldHours: 0, soldAmount: 0, remainingHours: 0, frequency: 0 },
  );
}

function groupCourseStats<T extends 'courseType' | 'coach'>(rows: CourseStat[], key: T) {
  const grouped = new Map<string, CourseStat[]>();
  rows.forEach((row) => grouped.set(row[key], [...(grouped.get(row[key]) ?? []), row]));
  return Array.from(grouped.entries()).map(([groupKey, groupRows]) => ({ key: groupKey, total: summarizeCourseStats(groupRows) }));
}

function CourseAssetOverview({ totals, range }: { totals: CourseSummary; range: string }) {
  const endDate = range.includes('至') ? range.split('至').pop()?.trim() ?? range : range;
  const periodName = getCoursePeriodName(range);
  const cumulativeSoldHours = totals.soldHours + totals.remainingHours * 3;
  const cumulativeCompletedHours = totals.completedHours + Math.round(totals.remainingHours * 2.15);
  const unitPrice = totals.soldHours > 0 ? totals.soldAmount / totals.soldHours : 0;
  const cumulativeSoldAmount = Math.round(cumulativeSoldHours * unitPrice);
  const cumulativeCompletedAmount = Math.round(cumulativeCompletedHours * unitPrice);
  const pendingAmount = Math.max(cumulativeSoldAmount - cumulativeCompletedAmount, 0);

  return (
    <section className="space-y-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-lg font-black text-slate-900">课程经营概览</div>
        </div>
        <div className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">截至日期：{endDate}</div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <CourseCoreMetric title={periodName + '售课金额'} value={money(totals.soldAmount)} helper={String(totals.soldHours) + '课时'} tone="blue" />
        <CourseCoreMetric title={periodName + '消课金额'} value={money(totals.completedAmount)} helper={String(totals.completedHours) + '课时'} tone="emerald" />
        <CourseCoreMetric title={'截止' + periodName + '待履约金额'} value={money(pendingAmount)} helper={String(totals.remainingHours) + '课时'} tone="amber" />
      </div>

      
    </section>
  );
}

function getCoursePeriodName(range: string) {
  if (range.includes('05-24')) return '自定义';
  if (range.includes('06-01 至 2026-06-30')) return '本月';
  if (range.includes('06-01 至 2026-06-07')) return '本周';
  return '本日';
}

function CourseCoreMetric({ title, value, helper, tone }: { title: string; value: string; helper: string; tone: 'blue' | 'emerald' | 'amber' }) {
  const toneClass = tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100';
  return (
    <div className={cn('rounded-lg border px-4 py-3', toneClass)}>
      <div className="text-xs font-black opacity-80">{title}</div>
      <div className="mt-2 text-3xl font-black tracking-normal">{value}</div>
      <div className="mt-1 text-xs font-semibold opacity-70">{helper}</div>
    </div>
  );
}

function CourseSituationCard({ title, icon: Icon, highlight, items }: { title: string; icon: typeof Store; highlight: { label: string; value: string }; items: { label: string; value: string }[] }) {
  const isSales = title === '售课情况';
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', isSales ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')}>
            <Icon size={17} />
          </span>
          {title}
        </div>
        <span className={cn('rounded px-2 py-1 text-[11px] font-black', isSales ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')}>{isSales ? '销售侧' : '履约侧'}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr]">
        <div className={cn('rounded-lg border px-4 py-3', isSales ? 'border-blue-100 bg-blue-50/60' : 'border-emerald-100 bg-emerald-50/60')}>
          <div className="text-xs font-bold text-slate-500">{highlight.label}</div>
          <div className={cn('mt-1 text-3xl font-black tracking-normal', isSales ? 'text-blue-700' : 'text-emerald-700')}>{highlight.value}</div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="text-xs font-bold text-slate-500">{item.label}</div>
              <div className="mt-1 text-lg font-black tracking-normal text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function courseTypeDisplayName(type: Exclude<CourseType, 'all'>) {
  if (type === 'private') return '\u79c1\u6559\u8bfe';
  if (type === 'small') return '\u5c0f\u73ed\u8bfe';
  return '\u56e2\u8bfe';
}

function CourseProductAnalysis({ activeType }: { activeType: CourseType }) {
  const visibleTabs = (activeType === 'all' ? ['private', 'small', 'group'] : [activeType]) as Exclude<CourseType, 'all'>[];
  const [tab, setTab] = useState<Exclude<CourseType, 'all'>>(visibleTabs[0]);
  const currentTab = visibleTabs.includes(tab) ? tab : visibleTabs[0];
  const rows = courseProductRows
    .filter((row) => row.courseType === currentTab)
    .sort((a, b) => b.soldAmount - a.soldAmount);
  const totals = rows.reduce(
    (acc, row) => ({
      soldHours: acc.soldHours + row.soldHours,
      soldAmount: acc.soldAmount + row.soldAmount,
      completedHours: acc.completedHours + row.completedHours,
      completedAmount: acc.completedAmount + row.completedAmount,
      remainingHours: acc.remainingHours + row.remainingHours,
    }),
    { soldHours: 0, soldAmount: 0, completedHours: 0, completedAmount: 0, remainingHours: 0 },
  );
  const pendingAmount = totals.soldHours > 0 ? Math.round((totals.soldAmount / totals.soldHours) * totals.remainingHours) : 0;
  const consumedRate = totals.soldHours > 0 ? (totals.completedHours / totals.soldHours) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {visibleTabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn('rounded-md px-4 py-2 text-base font-black', currentTab === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
          >
            {courseTypeDisplayName(item)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u8bfe\u7a0b\u540d\u79f0'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">{'\u552e\u8bfe\u91d1\u989d'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u552e\u8bfe\u8bfe\u65f6'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right text-emerald-700">{'\u6d88\u8bfe\u91d1\u989d'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u6d88\u8bfe\u8bfe\u65f6'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u5269\u4f59\u8bfe\u65f6'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u5f85\u5c65\u7ea6\u91d1\u989d'}</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u6d88\u8bfe\u7387'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rate = row.soldHours > 0 ? (row.completedHours / row.soldHours) * 100 : 0;
              const rowPendingAmount = row.soldHours > 0 ? Math.round((row.soldAmount / row.soldHours) * row.remainingHours) : 0;
              return (
                <tr key={row.name} className="font-bold text-slate-800">
                  <td className="border-b border-slate-100 px-3 py-3">{row.name}</td>
                  <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.soldAmount)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.soldHours}</td>
                  <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.completedAmount)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.completedHours}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.remainingHours}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(rowPendingAmount)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{rate.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-black text-slate-900">
              <td className="border-b border-slate-100 px-3 py-3">{'\u5408\u8ba1'}</td>
              <td className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right tabular-nums text-blue-700">{money(totals.soldAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{totals.soldHours}</td>
              <td className="border-b border-slate-100 bg-emerald-50/60 px-3 py-3 text-right tabular-nums text-emerald-700">{money(totals.completedAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{totals.completedHours}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{totals.remainingHours}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(pendingAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{consumedRate.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseClassAnalysisSummary({ totals, coachRows }: { totals: CourseSummary; coachRows: { key: string; total: CourseSummary }[] }) {
  const studentRows = buildStudentFrequencyRows(totals);
  const totalStudents = studentRows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label={'\u4e0a\u8bfe\u5b66\u5458\u6570'} value={String(totalStudents) + '\u4eba'} />
        <MiniStat label={'\u5df2\u6d88\u8bfe\u65f6'} value={String(totals.completedHours) + '\u8bfe\u65f6'} />
        <MiniStat label={'\u6d88\u8bfe\u91d1\u989d'} value={money(totals.completedAmount)} />
        <MiniStat label={'\u5f85\u4e0a\u8bfe\u8bfe\u65f6'} value={String(totals.pendingHours) + '\u8bfe\u65f6'} />
        <MiniStat label={'\u5df2\u53d6\u6d88\u8bfe\u65f6'} value={String(totals.cancelledHours) + '\u8bfe\u65f6'} />
      </div>
      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
        {'\u53e3\u5f84\u8bf4\u660e\uff1a\u5f85\u4e0a\u8bfe\u8bfe\u65f6\u6307\u5df2\u7ecf\u9884\u7ea6\u6392\u8bfe\u3001\u4f46\u5c1a\u672a\u5b9e\u9645\u5b8c\u6210\u4e0a\u8bfe\u7684\u8bfe\u65f6\uff0c\u4e0d\u7b49\u540c\u4e8e\u6240\u6709\u5269\u4f59\u672a\u6d88\u8017\u8bfe\u65f6\u3002'}
      </div>
      <CoachConsumptionRanking rows={coachRows} />
    </div>
  );
}

function buildStudentFrequencyRows(totals: CourseSummary) {
  const totalStudents = Math.max(Math.round(totals.frequency / 3), 1);
  const low = Math.max(Math.round(totalStudents * 0.64), 1);
  const mid = Math.max(Math.round(totalStudents * 0.2), 0);
  const highA = Math.max(Math.round(totalStudents * 0.1), 0);
  const highB = Math.max(Math.round(totalStudents * 0.04), 0);
  const used = low + mid + highA + highB;
  const highC = Math.max(totalStudents - used, 0);

  return [
    { label: '1-3\u6b21', count: low, color: '#635bff', level: 'low' as const },
    { label: '4-5\u6b21', count: mid, color: '#5b35d5', level: 'mid' as const },
    { label: '6-10\u6b21', count: highA, color: '#5797f7', level: 'high' as const },
    { label: '11-15\u6b21', count: highB, color: '#62c6e8', level: 'high' as const },
    { label: '16\u6b21\u4ee5\u4e0a', count: highC, color: '#f5d85e', level: 'high' as const },
  ];
}

function StudentFrequencyDonut({ rows, totalStudents }: { rows: { label: string; count: number; color: string }[]; totalStudents: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="grid items-center gap-4 md:grid-cols-[220px_1fr]">
      <div className="relative mx-auto h-56 w-56">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#eef2f7" strokeWidth="24" />
          {rows.map((row) => {
            const length = totalStudents > 0 ? (row.count / totalStudents) * circumference : 0;
            const segmentOffset = offset;
            offset += length;
            return <circle key={row.label} cx="80" cy="80" r={radius} fill="none" stroke={row.color} strokeWidth="24" strokeDasharray={String(length) + ' ' + String(circumference - length)} strokeDashoffset={-segmentOffset} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-slate-900">{totalStudents}\u4eba</div>
          <div className="mt-1 text-xs font-bold text-slate-400">{'\u4e0a\u8bfe\u5b66\u5458\u6570'}</div>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const percent = totalStudents > 0 ? ((row.count / totalStudents) * 100).toFixed(1) + '%' : '0.0%';
          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
              <div className="min-w-0 flex-1 text-sm font-black text-slate-700">{row.label}</div>
              <div className="text-right text-sm font-bold tabular-nums text-slate-900">{row.count}\u4eba</div>
              <div className="w-14 text-right text-xs font-semibold text-slate-400">{percent}</div>
            </div>
          );
        })}
        <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          <div className="min-w-0 flex-1 text-sm font-black text-slate-800">{'\u5408\u8ba1'}</div>
          <div className="text-right text-sm font-black tabular-nums text-slate-900">{totalStudents}\u4eba</div>
          <div className="w-14 text-right text-xs font-semibold text-slate-400">100%</div>
        </div>
      </div>
    </div>
  );
}

function CoachConsumptionRanking({ rows }: { rows: { key: string; total: CourseSummary }[] }) {
  const sorted = [...rows].sort((a, b) => b.total.completedHours - a.total.completedHours);
  const total = sorted.reduce(
    (acc, row) => ({
      completedHours: acc.completedHours + row.total.completedHours,
      completedAmount: acc.completedAmount + row.total.completedAmount,
      studentCount: acc.studentCount + Math.max(Math.round(row.total.frequency / 3), 1),
      pendingHours: acc.pendingHours + row.total.pendingHours,
      cancelledHours: acc.cancelledHours + row.total.cancelledHours,
    }),
    { completedHours: 0, completedAmount: 0, studentCount: 0, pendingHours: 0, cancelledHours: 0 },
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u6392\u540d'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u6559\u7ec3'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u6240\u5728\u95e8\u5e97'}</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">{'\u5df2\u6d88\u8bfe\u65f6'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u6d88\u8bfe\u91d1\u989d'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u4e0a\u8bfe\u5b66\u5458\u6570'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u5f85\u4e0a\u8bfe\u8bfe\u65f6'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u53d6\u6d88\u8bfe\u65f6'}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => {
            const coachName = coachOptions.find((item) => item.id === row.key)?.name ?? row.key;
            const storeNames = getCoachStoreNames(row.key);
            const studentCount = Math.max(Math.round(row.total.frequency / 3), 1);
            return (
              <tr key={row.key} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{index + 1}</td>
                <td className="border-b border-slate-100 px-3 py-3">{coachName}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{storeNames}</td>
                <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{row.total.completedHours}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.completedAmount)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{studentCount}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.total.pendingHours}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.total.cancelledHours}</td>
              </tr>
            );
          })}
          <tr className="bg-slate-50 font-black text-slate-900">
            <td className="border-b border-slate-100 px-3 py-3">-</td>
            <td className="border-b border-slate-100 px-3 py-3">{'\u5408\u8ba1'}</td>
            <td className="border-b border-slate-100 px-3 py-3">-</td>
            <td className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right tabular-nums text-blue-700">{total.completedHours}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(total.completedAmount)}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.studentCount}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.pendingHours}</td>
            <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.cancelledHours}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function getCoachStoreNames(coachKey: string) {
  const storeIds = Array.from(new Set(courseStats.filter((item) => item.coach === coachKey).map((item) => item.venue)));
  return storeIds.map((id) => stores.find((store) => store.id === id)?.name ?? id).join(' / ');
}

function CourseInsightCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">
      <div className="mb-1 text-base font-black text-slate-800">{title}</div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black tracking-normal text-slate-900">{value}</div>
    </div>
  );
}

function ProgressMetric({ label, value, helper, tone = 'blue' }: { label: string; value: number; helper: string; tone?: 'blue' | 'amber' }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="flex items-center justify-between text-xs font-black text-slate-600">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={cn('h-full rounded-full', tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500')} style={{ width: String(value) + '%' }} />
      </div>
      <div className="mt-1 text-[11px] font-semibold text-slate-400">{helper}</div>
    </div>
  );
}

function VenueBookingReport({
  period,
  store,
  customRange,
  onPeriodChange,
  onCustomRangeChange,
  onStoreChange,
  orders,
}: {
  period: Period;
  store: StoreId;
  customRange: CustomDateRange;
  onPeriodChange: (period: Period) => void;
  onCustomRangeChange: (range: CustomDateRange) => void;
  onStoreChange: (store: StoreId) => void;
  orders: RevenueOrder[];
}) {
  const venueOrders = useMemo(
    () => orders.filter((order) => order.project === 'venue'),
    [orders],
  );
  const totals = useMemo(() => summarizeVenueFinancial(venueOrders), [venueOrders]);
  const baseSourceRows = useMemo(() => groupVenueFinancialBy(venueOrders, 'source'), [venueOrders]);
  const [selectedSubVenue, setSelectedSubVenue] = useState<VenueSubVenue>('all');
  const selectedSubVenueTotal = useMemo(() => selectedSubVenue === 'all' ? totals : scaleVenueTotal(totals, getVenueSubVenueWeight(selectedSubVenue)), [selectedSubVenue, totals]);
  const sourceRows = useMemo(() => selectedSubVenue === 'all' ? baseSourceRows : scaleVenueRows(baseSourceRows, getVenueSubVenueWeight(selectedSubVenue)), [baseSourceRows, selectedSubVenue]);
  const courtRows = useMemo(() => buildCourtRows(totals), [totals]);
  const [analysisTab, setAnalysisTab] = useState<'time' | 'court'>('time');
  const [analysisVenue, setAnalysisVenue] = useState<VenueSubVenue>('badminton');
  const timeRows = useMemo(() => buildVenueTimeRows(mergeVenueTotals(courtRows.map((row) => row.total)), 1), [courtRows]);
  const memberRows = useMemo(() => buildMemberRows(selectedSubVenueTotal), [selectedSubVenueTotal]);
  const bookingMethodRows = useMemo(() => buildBookingMethodRows(selectedSubVenueTotal), [selectedSubVenueTotal]);
  const sceneRows = useMemo(() => buildVenueSceneRows(selectedSubVenueTotal), [selectedSubVenueTotal]);
  const activePeriod = getActivePeriod(period, customRange);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <Segmented value={period} customRange={customRange} onChange={onPeriodChange} onCustomRangeChange={onCustomRangeChange} />
          <div className="mt-1.5 text-xs font-semibold text-slate-500">统计区间：{activePeriod.range}</div>
        </div>
        <SelectBox icon={Building2} value={store} onChange={(value) => onStoreChange(value as StoreId)} options={stores} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_auto_1fr_auto_1fr] xl:items-center">
          <BillFormulaItem label="订场经营发生额" value={money(selectedSubVenueTotal.businessAmount)} primary />
          <FormulaOperator value="=" />
          <BillFormulaItem
            label="订场平台营收"
            value={money(selectedSubVenueTotal.actualRevenue)}
            note="平台销售额 - 平台退款额"
            details={[
              { label: '平台销售额', value: money(selectedSubVenueTotal.sales) },
              { label: '平台退款额', value: money(selectedSubVenueTotal.refund) },
            ]}
          />
          <FormulaOperator value="+" />
          <BillFormulaItem
            label="储值卡/余额支付"
            value={money(selectedSubVenueTotal.storedBalance)}
            note="预收余额消费"
            details={[
              { label: '储值卡支付', value: money(selectedSubVenueTotal.storedCardPay) },
              { label: '余额支付', value: money(selectedSubVenueTotal.balancePay) },
            ]}
          />
        </div>
      </section>

      <section>
        <div className="grid gap-4 xl:grid-cols-3">
          <CompactRevenueCards
            title="销售渠道"
            rows={sourceRows.map((row) => ({ key: sourceMeta[row.key as Source].name, total: row.total }))}
            total={selectedSubVenueTotal.businessAmount}
          />
          <CompactRevenueCards title="用户类型" rows={memberRows} total={selectedSubVenueTotal.businessAmount} />
          <CompactRevenueCards title="订场方式" rows={bookingMethodRows} total={selectedSubVenueTotal.businessAmount} />
        </div>
      </section>

      <VenueSceneTable rows={sceneRows} subVenue={selectedSubVenue} />

      <section className="rounded-lg border border-slate-100 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex min-h-12 items-center px-3.5 pt-3">
          <VenueAnalysisTabs value={analysisTab} onChange={setAnalysisTab} />
        </div>
        <div className="p-3.5">
          {analysisTab === 'time' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <VenueAnalysisVenueSelect value={analysisVenue} onChange={setAnalysisVenue} />
                <button className="flex h-10 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-sm font-bold text-white">
                  <Download size={15} />
                  导出
                </button>
              </div>
              <VenueLineChart rows={timeRows} />
              <TimeFinancialTable rows={timeRows} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <VenueAnalysisVenueSelect value={analysisVenue} onChange={setAnalysisVenue} />
                <button className="flex h-10 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-sm font-bold text-white">
                  <Download size={15} />
                  导出
                </button>
              </div>
              <CourtSalesTable rows={courtRows} />
            </div>
          )}
        </div>
      </section>

      <KeyMetricNotes
        items={[
          '订场平台营收 = 场地平台销售额 - 场地平台退款额；平台销售额不含储值卡/余额支付。',
          '订场经营发生额 = 订场平台营收 + 储值卡/余额支付，用于查看订场业务规模。',
          '储值卡/余额支付为预收余额消费，不重复计入平台营收。',
          '销售渠道、用户类型、订场方式、场景分布、分时段分析和场地号分析均按订场经营发生额拆分。',
          '场景分布按场馆和订场场景展示，空值表示当前无该场景发生额。',
        ]}
      />
    </div>
  );
}

function VenueAnalysisVenueSelect({ value, onChange }: { value: VenueSubVenue; onChange: (value: VenueSubVenue) => void }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
      场馆选择
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as VenueSubVenue)}
        className="min-w-28 bg-transparent outline-none"
        disabled={venueAnalysisVenueOptions.length === 1}
      >
        {venueAnalysisVenueOptions.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
    </label>
  );
}

function VenueLineChart({ rows }: { rows: { label: string; total: VenueFinancialTotal }[] }) {
  const values = rows.map((row) => Math.max(row.total.businessAmount, 0));
  const max = Math.max(...values, 1);
  const width = 980;
  const height = 210;
  const paddingX = 42;
  const paddingY = 30;
  const points = values.map((value, index) => {
    const x = rows.length === 1 ? width / 2 : paddingX + (index * (width - paddingX * 2)) / (rows.length - 1);
    const y = height - paddingY - (value / max) * (height - paddingY * 2);
    return { x, y };
  });
  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const fillData = points.length ? `${pathData} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z` : '';

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[920px] rounded-lg bg-slate-50">
        <path d={fillData} fill="rgba(37, 99, 235, 0.08)" />
        <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={rows[index].label}>
            <circle cx={point.x} cy={point.y} r="3" fill="#2563eb" />
            <text x={point.x} y={point.y - 8} textAnchor="middle" className="fill-slate-700 text-[8px] font-bold">
              {money(values[index])}
            </text>
            <text x={point.x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[8px] font-bold">
              {rows[index].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function TimeFinancialTable({ rows }: { rows: { label: string; total: VenueFinancialTotal }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">时段</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">平台销售额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">平台退款额</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">平台营收</th>
            <th className="border-b border-slate-100 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">储值卡/余额支付</th>
            <th className="border-b border-slate-100 bg-slate-100 px-3 py-3 text-right text-slate-800">经营发生额</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.label}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.sales)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.refund)}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.total.actualRevenue)}</td>
              <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.total.storedBalance)}</td>
              <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right font-black tabular-nums text-slate-900">{money(row.total.businessAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VenueAnalysisTabs({ value, onChange }: { value: 'time' | 'court'; onChange: (value: 'time' | 'court') => void }) {
  return (
    <div className="flex rounded-md bg-slate-100 p-1">
      {[
        { id: 'time', label: '分时段分析' },
        { id: 'court', label: '场地号分析' },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id as 'time' | 'court')}
          className={cn('h-10 rounded px-4 text-sm font-black', value === item.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800')}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function CompactRevenueCards({
  title,
  rows,
  total,
  variant = 'default',
}: {
  title: string;
  rows: { key: string; total: ReturnType<typeof summarize> | VenueFinancialTotal }[];
  total: number;
  variant?: 'default' | 'wide';
}) {
  const isWide = variant === 'wide';
  const colors = ['#e96a7a', '#a855f7', '#a5b4fc', '#38bdf8', '#22c55e', '#f59e0b', '#14b8a6', '#6366f1', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#64748b'];
  const values = rows.map((row) => Math.max(row.total.businessAmount, 0));
  const sum = values.reduce((acc, value) => acc + value, 0);
  let offset = 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/30">
      <div className="mb-3 text-sm font-black text-slate-800">{title}</div>
      <div className={cn('grid items-center gap-4', isWide ? 'lg:grid-cols-[240px_1fr]' : 'md:grid-cols-[220px_1fr]')}>
        <div className="relative mx-auto h-56 w-56">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#eef2f7" strokeWidth="24" />
            {rows.map((row, index) => {
              const value = values[index];
              const length = sum > 0 ? (value / sum) * circumference : 0;
              const segmentOffset = offset;
              offset += length;

              return (
                <circle
                  key={row.key}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth="24"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-segmentOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-slate-400">合计</div>
            <div className="mt-1 text-lg font-black tracking-normal text-slate-900">{money(sum)}</div>
          </div>
        </div>
        <div className={cn(isWide ? 'grid gap-2 sm:grid-cols-2 xl:grid-cols-4' : 'space-y-3')}>
          {rows.map((row, index) => {
            const value = values[index];
            const share = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0.0%';
            return (
              <div key={row.key} className={cn('flex items-start gap-3', isWide ? 'rounded-md bg-slate-50 px-2.5 py-2' : '')}>
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-slate-700">{row.key}</div>
                  <div className={cn('font-bold tabular-nums text-slate-900', isWide ? 'mt-0.5 text-sm' : 'mt-1 text-base')}>{money(value)}</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-400">占比 {share}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CourtRevenueList({ rows }: { rows: CourtSalesRow[] }) {
  const max = Math.max(...rows.map((row) => Math.max(row.total.actualRevenue, 0)), 1);

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const value = Math.max(row.total.actualRevenue, 0);
        return (
          <div key={row.key} className="rounded-lg border border-slate-100 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', row.courtType === 'VIP场' ? 'bg-amber-500' : 'bg-blue-500')} />
                <span className="truncate text-sm font-black text-slate-800">{row.key}</span>
              </div>
              <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold', row.courtType === 'VIP场' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500')}>{row.courtType}</span>
            </div>
            <div className="mt-2 text-xl font-black tracking-normal text-slate-900">{money(value)}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full', row.courtType === 'VIP场' ? 'bg-amber-500' : 'bg-blue-500')} style={{ width: `${Math.max((value / max) * 100, 8)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VenueFinancialTable({
  rows,
  firstColumn,
  showShare,
  total = 0,
}: {
  rows: { key: string; total: ReturnType<typeof summarize> | VenueFinancialTotal }[];
  firstColumn: string;
  showShare?: boolean;
  total?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">{firstColumn}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">平台销售额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">平台退款额</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">平台营收</th>
            <th className="border-b border-slate-100 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">储值卡/余额支付</th>
            <th className="border-b border-slate-100 bg-slate-100 px-3 py-3 text-right text-slate-800">经营发生额</th>
            {showShare && <th className="border-b border-slate-100 px-3 py-3 text-right">占比</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const share = total > 0 ? ((Math.max(row.total.businessAmount, 0) / total) * 100).toFixed(1) + '%' : '0.0%';
            return (
              <tr key={row.key} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{row.key}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.sales)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.refund)}</td>
                <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.total.actualRevenue)}</td>
                <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.total.storedBalance)}</td>
                <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right font-black tabular-nums text-slate-900">{money(row.total.businessAmount)}</td>
                  {showShare && <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{share}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type VenueFinancialTotal = {
  sales: number;
  refund: number;
  storedBalance: number;
  storedCardPay: number;
  balancePay: number;
  thirdPartyGroup: number;
  meituan: number;
  douyin: number;
  actualRevenue: number;
  businessAmount: number;
  orders: number;
};

type CourtSalesRow = {
  key: string;
  courtType: string;
  hours: number;
  total: VenueFinancialTotal;
};

function CourtSalesTable({ rows }: { rows: CourtSalesRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">场地号</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">场地类型</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">平台销售额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">平台退款额</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">平台营收</th>
            <th className="border-b border-slate-100 bg-emerald-50/50 px-3 py-3 text-right text-emerald-700">储值卡/余额支付</th>
            <th className="border-b border-slate-100 bg-slate-100 px-3 py-3 text-right text-slate-800">经营发生额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">预订时长</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.key}</td>
              <td className="border-b border-slate-100 px-3 py-3">
                <span className={cn('rounded px-2 py-1 text-xs', row.courtType === 'VIP场' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>{row.courtType}</span>
              </td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.sales)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.total.refund)}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.total.actualRevenue)}</td>
              <td className="border-b border-slate-100 bg-emerald-50/40 px-3 py-3 text-right tabular-nums text-emerald-700">{money(row.total.storedBalance)}</td>
              <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right font-black tabular-nums text-slate-900">{money(row.total.businessAmount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.hours}小时</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildVenueTimeRows(total: VenueFinancialTotal, granularity: TimeGranularity) {
  const weights = [0.04, 0.05, 0.06, 0.05, 0.07, 0.08, 0.07, 0.08, 0.1, 0.12, 0.12, 0.09, 0.04, 0.03];
  const hourly = distributeVenueFinancial(total, weights, 8);
  const rows = [];
  for (let start = 8; start < 22; start += granularity) {
    const end = Math.min(start + granularity, 22);
    const bucket = hourly.filter((item) => item.hour >= start && item.hour < end);
    rows.push({
      label: `${padHour(start)}:00-${padHour(end)}:00`,
      total: mergeVenueTotals(bucket.map((item) => item.total)),
    });
  }
  return rows;
}

function buildCourtRows(total: VenueFinancialTotal): CourtSalesRow[] {
  const courts = [
    ...Array.from({ length: 10 }, (_, index) => ({ key: `${index + 1}号场`, courtType: '普通场' as const, weight: 0.072 + (index % 3) * 0.006 })),
    { key: 'VIP1号场', courtType: 'VIP场' as const, weight: 0.13 },
    { key: 'VIP2号场', courtType: 'VIP场' as const, weight: 0.12 },
  ];
  const weightTotal = courts.reduce((sum, court) => sum + court.weight, 0);
  const normalized = courts.map((court) => ({ ...court, weight: court.weight / weightTotal }));
  const distributed = distributeVenueFinancial(total, normalized.map((court) => court.weight));

  return normalized.map((court, index) => ({
    key: court.key,
    courtType: court.courtType,
    hours: Math.max(Math.round(distributed[index].total.orders * (court.courtType === 'VIP场' ? 1.8 : 1.4)), 1),
    total: distributed[index].total,
  }));
}

function buildMemberRows(total: VenueFinancialTotal) {
  const vipSales = Math.round(total.sales * 0.56);
  const vipRefund = Math.round(total.refund * 0.45);
  const vipStored = total.storedBalance;
  const vipOrders = Math.round(total.orders * 0.52);
  const vipStoredCardPay = vipStored;
  const vipBalancePay = 0;
  const vipThirdParty = 0;
  const vipActual = Math.max(vipSales - vipRefund, 0);
  const vipBusiness = vipActual + vipStored + vipThirdParty;
  const guest = {
    sales: total.sales - vipSales,
    refund: total.refund - vipRefund,
    storedBalance: 0,
    storedCardPay: 0,
    balancePay: 0,
    thirdPartyGroup: total.thirdPartyGroup,
    meituan: total.meituan,
    douyin: total.douyin,
    actualRevenue: total.actualRevenue - vipActual,
    businessAmount: Math.max(total.businessAmount - vipBusiness, 0),
    orders: total.orders - vipOrders,
  };

  return [
    { key: '会员', total: { sales: vipSales, refund: vipRefund, storedBalance: vipStored, storedCardPay: vipStoredCardPay, balancePay: vipBalancePay, thirdPartyGroup: vipThirdParty, meituan: 0, douyin: 0, actualRevenue: vipActual, businessAmount: vipBusiness, orders: vipOrders } },
    { key: '散客', total: guest },
  ];
}

function buildBookingMethodRows(total: VenueFinancialTotal) {
  const methods = [
    { key: '普通场订场', weight: 0.78 },
    { key: '固定场订场', weight: 0.22 },
  ];
  const distributed = distributeVenueFinancial(total, methods.map((method) => method.weight));
  return methods.map((method, index) => ({ key: method.key, total: distributed[index].total }));
}

function VenueSceneTable({ rows }: { rows: { key: string; total: VenueFinancialTotal }[]; subVenue: VenueSubVenue }) {
  const tableRows = buildVenueSceneDisplayRows(rows);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm shadow-slate-200/30">
      <div className="border-b border-slate-100 px-4 py-3 text-sm font-black text-slate-800">场景分布</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1440px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-black text-slate-700">
              <th className="sticky left-0 z-10 border-b border-r border-slate-100 bg-slate-50 px-4 py-3 text-left">场馆名称</th>
              {rows.map((row) => (
                <th key={row.key} className="border-b border-r border-slate-100 px-4 py-3 text-left">{row.key}</th>
              ))}
              <th className="border-b border-r border-slate-100 bg-blue-50 px-4 py-3 text-left text-blue-700">合计</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((venueRow) => (
              <tr key={venueRow.name} className="font-bold text-slate-700">
                <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-4 py-4 text-slate-800">{venueRow.name}</td>
                {venueRow.rows.map((row) => (
                  <td key={row.key} className="border-b border-r border-slate-100 px-4 py-4 tabular-nums">
                    {row.total.orders > 0 || row.total.businessAmount > 0 ? `${row.total.orders}场，${money(row.total.businessAmount)}` : '-'}
                  </td>
                ))}
                <td className="border-b border-r border-slate-100 bg-blue-50/40 px-4 py-4 font-black tabular-nums text-blue-700">
                  {venueRow.total.orders}场，{money(venueRow.total.businessAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildVenueSceneDisplayRows(rows: { key: string; total: VenueFinancialTotal }[]) {
  const total = mergeVenueTotals(rows.map((row) => row.total));
  const basketballAmount = Math.round(total.businessAmount * 0.18);
  const badmintonAmount = Math.max(total.businessAmount - basketballAmount, 0);
  const basketballOrders = Math.round(total.orders * 0.16);
  const badmintonOrders = Math.max(total.orders - basketballOrders, 0);

  const badmintonWeights: Record<string, number> = {
    '常规订场': 0.5,
    '换场': 0.08,
    '培训': 0.14,
    '赛事': 0.11,
    '活动': 0.06,
    '其他': 0.03,
  };

  const badmintonRows = buildSparseVenueSceneRows(rows, badmintonAmount, badmintonOrders, badmintonWeights);
  const basketballRows = buildSparseVenueSceneRows(rows, basketballAmount, basketballOrders, { '常规订场': 1 });

  const displayRows = [
    { name: '羽毛球馆', rows: badmintonRows },
    { name: '篮球馆', rows: basketballRows },
  ];

  return displayRows.map((item) => ({
    ...item,
    total: mergeVenueTotals(item.rows.map((row) => row.total)),
  }));
}

function buildSparseVenueSceneRows(rows: { key: string; total: VenueFinancialTotal }[], amountTotal: number, orderTotal: number, weights: Record<string, number>) {
  let usedAmount = 0;
  let usedOrders = 0;
  const activeKeys = Object.keys(weights);

  return rows.map((row) => {
    const weight = weights[row.key] ?? 0;
    const isLastActive = row.key === activeKeys[activeKeys.length - 1];
    const amount = weight === 0 ? 0 : isLastActive ? Math.max(amountTotal - usedAmount, 0) : Math.round(amountTotal * weight);
    const orders = weight === 0 ? 0 : isLastActive ? Math.max(orderTotal - usedOrders, 0) : Math.round(orderTotal * weight);
    usedAmount += amount;
    usedOrders += orders;
    return {
      key: row.key,
      total: {
        sales: amount,
        refund: 0,
        storedBalance: 0,
        storedCardPay: 0,
        balancePay: 0,
        thirdPartyGroup: 0,
        meituan: 0,
        douyin: 0,
        actualRevenue: amount,
        businessAmount: amount,
        orders,
      },
    };
  });
}

function buildVenueSceneRows(total: VenueFinancialTotal) {
  const scenes = [
    { key: '常规订场', weight: 0.32 },
    { key: '换场', weight: 0.1 },
    { key: '锁场', weight: 0.08 },
    { key: '培训', weight: 0.09 },
    { key: '赛事', weight: 0.08 },
    { key: '活动', weight: 0.06 },
    { key: '接待', weight: 0.05 },
    { key: '赠券', weight: 0.05 },
    { key: '直播间购买', weight: 0.04 },
    { key: '小程序秒杀', weight: 0.03 },
    { key: '合作公司', weight: 0.03 },
    { key: '其他', weight: 0.02 },
  ];
  const distributed = distributeVenueFinancial(total, scenes.map((scene) => scene.weight));
  return scenes.map((scene, index) => ({ key: scene.key, total: distributed[index].total }));
}

function getVenueSubVenueWeight(subVenue: VenueSubVenue) {
  return venueSubVenues.find((item) => item.id === subVenue)?.weight ?? 1;
}

function scaleVenueRows<T extends { key: string; total: VenueFinancialTotal }>(rows: T[], weight: number): T[] {
  return rows.map((row) => ({ ...row, total: scaleVenueTotal(row.total, weight) }));
}

function scaleVenueTotal(total: VenueFinancialTotal, weight: number): VenueFinancialTotal {
  return {
    sales: Math.round(total.sales * weight),
    refund: Math.round(total.refund * weight),
    storedBalance: Math.round(total.storedBalance * weight),
    storedCardPay: Math.round(total.storedCardPay * weight),
    balancePay: Math.round(total.balancePay * weight),
    thirdPartyGroup: Math.round(total.thirdPartyGroup * weight),
    meituan: Math.round(total.meituan * weight),
    douyin: Math.round(total.douyin * weight),
    actualRevenue: Math.max(Math.round(total.actualRevenue * weight), 0),
    businessAmount: Math.max(Math.round(total.businessAmount * weight), 0),
    orders: Math.round(total.orders * weight),
  };
}

function distributeVenueFinancial(total: VenueFinancialTotal, weights: number[], startHour = 0) {
  let usedSales = 0;
  let usedRefund = 0;
  let usedStored = 0;
  let usedStoredCardPay = 0;
  let usedBalancePay = 0;
  let usedThirdParty = 0;
  let usedMeituan = 0;
  let usedDouyin = 0;
  let usedActual = 0;
  let usedBusiness = 0;
  let usedOrders = 0;

  return weights.map((weight, index) => {
    const isLast = index === weights.length - 1;
    const sales = isLast ? total.sales - usedSales : Math.round(total.sales * weight);
    const refund = isLast ? total.refund - usedRefund : Math.round(total.refund * weight);
    const storedBalance = isLast ? total.storedBalance - usedStored : Math.round(total.storedBalance * weight);
    const storedCardPay = isLast ? total.storedCardPay - usedStoredCardPay : Math.round(total.storedCardPay * weight);
    const balancePay = isLast ? total.balancePay - usedBalancePay : Math.round(total.balancePay * weight);
    const thirdPartyGroup = isLast ? total.thirdPartyGroup - usedThirdParty : Math.round(total.thirdPartyGroup * weight);
    const meituan = isLast ? total.meituan - usedMeituan : Math.round(total.meituan * weight);
    const douyin = isLast ? total.douyin - usedDouyin : Math.round(total.douyin * weight);
    const actualRevenue = isLast ? total.actualRevenue - usedActual : Math.round(total.actualRevenue * weight);
    const businessAmount = isLast ? total.businessAmount - usedBusiness : Math.round(total.businessAmount * weight);
    const orders = isLast ? total.orders - usedOrders : Math.round(total.orders * weight);
    usedSales += sales;
    usedRefund += refund;
    usedStored += storedBalance;
    usedStoredCardPay += storedCardPay;
    usedBalancePay += balancePay;
    usedThirdParty += thirdPartyGroup;
    usedMeituan += meituan;
    usedDouyin += douyin;
    usedActual += actualRevenue;
    usedBusiness += businessAmount;
    usedOrders += orders;
    return {
      hour: startHour + index,
      total: {
        sales,
        refund,
        storedBalance,
        storedCardPay,
        balancePay,
        thirdPartyGroup,
        meituan,
        douyin,
        actualRevenue: Math.max(actualRevenue, 0),
        businessAmount: Math.max(businessAmount, 0),
        orders,
      },
    };
  });
}

function summarizeVenueFinancial(rows: RevenueOrder[]): VenueFinancialTotal {
  const total = summarizeRevenueComposition(rows);
  return {
    sales: total.sales,
    refund: Math.min(total.refund, total.sales),
    storedBalance: total.storedBalance,
    storedCardPay: Math.round(total.storedBalance * 0.7),
    balancePay: total.storedBalance - Math.round(total.storedBalance * 0.7),
    thirdPartyGroup: total.thirdPartyGroup,
    meituan: total.meituan,
    douyin: total.douyin,
    actualRevenue: total.actualRevenue,
    businessAmount: total.actualRevenue + total.storedBalance,
    orders: total.orders,
  };
}

function groupVenueFinancialBy<T extends keyof RevenueOrder>(rows: RevenueOrder[], key: T) {
  const grouped = new Map<string, RevenueOrder[]>();
  rows.forEach((row) => {
    const groupKey = String(row[key]);
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), row]);
  });
  return Array.from(grouped.entries())
    .map(([groupKey, groupRows]) => ({ key: groupKey, total: summarizeVenueFinancial(groupRows) }))
    .sort((a, b) => b.total.actualRevenue - a.total.actualRevenue);
}

function mergeVenueTotals(totals: VenueFinancialTotal[]) {
  return totals.reduce<VenueFinancialTotal>(
    (acc, total) => ({
      sales: acc.sales + total.sales,
      refund: acc.refund + total.refund,
      storedBalance: acc.storedBalance + total.storedBalance,
      storedCardPay: acc.storedCardPay + total.storedCardPay,
      balancePay: acc.balancePay + total.balancePay,
      thirdPartyGroup: acc.thirdPartyGroup + total.thirdPartyGroup,
      meituan: acc.meituan + total.meituan,
      douyin: acc.douyin + total.douyin,
      actualRevenue: acc.actualRevenue + total.actualRevenue,
      businessAmount: acc.businessAmount + total.businessAmount,
      orders: acc.orders + total.orders,
    }),
    { sales: 0, refund: 0, storedBalance: 0, storedCardPay: 0, balancePay: 0, thirdPartyGroup: 0, meituan: 0, douyin: 0, actualRevenue: 0, businessAmount: 0, orders: 0 },
  );
}

function padHour(value: number) {
  return String(value).padStart(2, '0');
}

function RecognitionIncomeDashboard({
  period,
  customRange,
  store,
  onPeriodChange,
  onCustomRangeChange,
  onStoreChange,
}: {
  period: Period;
  customRange: CustomDateRange;
  store: StoreId;
  onPeriodChange: (period: Period) => void;
  onCustomRangeChange: (range: CustomDateRange) => void;
  onStoreChange: (store: StoreId) => void;
}) {
  const [recognitionStoreTab, setRecognitionStoreTab] = useState<'store' | 'product'>('store');
  const activePeriod = getActivePeriod(period, customRange);
  const periodLabel = getRecognitionPeriodLabel(period);
  const recognitionMonth = getRecognitionMonthForPeriod(period, customRange);
  const cards = useMemo(() => recognitionCardSales.filter((item) => store === 'all' || item.store === store), [store]);
  const metrics = useMemo(() => recognitionReportMetrics(cards, recognitionMonth), [cards, recognitionMonth]);
  const categoryRows = useMemo(() => recognitionReportCategoryRows(cards, recognitionMonth), [cards, recognitionMonth]);
  const storeRows = useMemo(() => recognitionReportStoreRows(cards, store, recognitionMonth), [cards, store, recognitionMonth]);
  const productRows = useMemo(() => recognitionReportProductRows(cards, recognitionMonth), [cards, recognitionMonth]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-3 border-b border-slate-200 pb-4">
        <div>
          <Segmented value={period} customRange={customRange} onChange={onPeriodChange} onCustomRangeChange={onCustomRangeChange} />
          <div className="mt-1.5 text-xs font-semibold text-slate-500">统计区间：{activePeriod.range}</div>
        </div>
        <SelectBox icon={Building2} value={store} onChange={(value) => onStoreChange(value as StoreId)} options={fitnessStores} />
      </div>

      <section className="grid gap-3 lg:grid-cols-4">
        <MetricCard title={periodLabel + '确认收入'} value={money(metrics.currentRecognized)} accent="bg-blue-600 text-white ring-1 ring-blue-500" large />
        <MetricCard title={periodLabel + '销售金额'} value={money(metrics.monthlySalesTotal)} />
        <MetricCard title={'期末待确认收入'} value={money(metrics.pending)} />
        <MetricCard title={periodLabel + '新售待确认'} value={money(metrics.monthlyPending)} />
      </section>

      <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
确认收入按履约和结转规则统计：售卡/充值属于预收款，消费或核销履约后再确认收入。
      </div>

      <Panel title={'\u6536\u5165\u7c7b\u578b\u7edf\u8ba1'} icon={CreditCard}>
        <RecognitionReportCategoryTable rows={categoryRows} total={metrics.currentRecognized} periodLabel={periodLabel} />
      </Panel>

      <Panel title={'\u95e8\u5e97\u786e\u8ba4\u6536\u5165\u7edf\u8ba1'} icon={Building2}>
        <div className="mb-3 inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
          {[
            { key: 'store', label: '按门店统计' },
            { key: 'product', label: '按项目/卡项统计' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRecognitionStoreTab(item.key as 'store' | 'product')}
              className={cn(
                'rounded px-4 py-2 text-sm font-black transition',
                recognitionStoreTab === item.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {recognitionStoreTab === 'store' ? <RecognitionReportStoreTable rows={storeRows} periodLabel={periodLabel} /> : <RecognitionReportProductTable rows={productRows} periodLabel={periodLabel} />}
      </Panel>


      <KeyMetricNotes
        items={[
          '确认收入按卡项配置的确认期数进行结转，筛选区间用于查看对应范围内的确认收入。',
          '储值卡销售、余额充值作为预收款，不在售卡/充值当期确认收入；会员实际消费时按消耗金额确认收入。',
          '第三方团购核销形成的平台权益按对应卡项或服务的履约规则确认收入，补贴券和退款需以第三方平台核对为准。',
          '商品销售在付款当期确认收入。',
          '待确认收入余额为截至统计区间结束日仍未完成结转或履约确认的余额。',
        ]}
      />
    </div>
  );
}

function getRecognitionPeriodLabel(period: Period) {
  if (period === 'today') return '本日';
  if (period === 'week') return '本周';
  if (period === 'month') return '本月';
  return '自定义';
}

function getRecognitionMonthForPeriod(period: Period, customRange: CustomDateRange) {
  if (period === 'custom') return customRange.end.slice(0, 7);
  return defaultRecognitionMonth;
}

function recognitionReportMetrics(items: RecognitionCardSale[], month: string) {
  const monthlySalesTotal = items.filter((item) => item.paidAt.startsWith(month)).reduce((sum, item) => sum + item.paid, 0);
  const currentRecognized = items.reduce((sum, item) => sum + getReportCurrentRecognizedAmount(item, month), 0);
  const pending = items.reduce((sum, item) => sum + getReportPendingAmount(item, month), 0);
  const monthlyPending = items.filter((item) => item.paidAt.startsWith(month)).reduce((sum, item) => sum + getReportPendingAmount(item, month), 0);
  return { currentRecognized, monthlySalesTotal, pending, monthlyPending };
}

function recognitionReportCategoryRows(items: RecognitionCardSale[], month: string) {
  return (Object.keys(recognitionCategoryMeta) as RecognitionCardSale['category'][]).map((category) => {
    const rows = items.filter((item) => item.category === category);
    const metrics = recognitionReportMetrics(rows, month);
    return { key: category, ...metrics };
  });
}

function recognitionReportStoreRows(items: RecognitionCardSale[], selectedStore: StoreId, month: string) {
  return fitnessStores
    .filter((item) => item.id !== 'all' && (selectedStore === 'all' || item.id === selectedStore))
    .map((storeItem) => {
      const rows = items.filter((item) => item.store === storeItem.id);
      return { storeName: storeItem.name, ...recognitionReportMetrics(rows, month) };
    })
    .sort((a, b) => b.currentRecognized - a.currentRecognized);
}

function recognitionReportProductRows(items: RecognitionCardSale[], month: string) {
  const groups = new Map<string, RecognitionCardSale[]>();
  items.forEach((item) => {
    const key = item.category + '::' + item.product;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return Array.from(groups.values())
    .map((rows) => {
      const first = rows[0];
      return {
        key: first.category + '::' + first.product,
        product: first.product,
        category: first.category,
        periodsLabel: first.category === 'storedValue' ? '\u6d88\u8d39\u786e\u8ba4' : String(Math.max(...rows.map((item) => item.periods))),
        ...recognitionReportMetrics(rows, month),
      };
    })
    .sort((a, b) => b.currentRecognized - a.currentRecognized);
}

function recognitionReportDetailRows(items: RecognitionCardSale[], month: string) {
  return items
    .map((item) => ({
      item,
      currentRecognized: getReportCurrentRecognizedAmount(item, month),
      recognizedToMonth: getReportRecognizedToMonth(item, month),
      pending: getReportPendingAmount(item, month),
      currentPeriods: getReportConfirmedPeriods(item, month),
    }))
    .filter((row) => row.currentRecognized > 0 || row.item.paidAt.startsWith(month) || row.pending > 0)
    .sort((a, b) => b.currentRecognized - a.currentRecognized);
}

function getStoredValueConsumptionAmount(item: RecognitionCardSale, month: string) {
  const diff = getMonthNumber(month) - getMonthNumber(item.paidAt.slice(0, 7));
  if (diff < 0) return 0;
  const rates = [0.22, 0.18, 0.14, 0.12, 0.1, 0.08];
  return Math.min(Math.round(item.paid * (rates[diff] ?? 0.05)), item.paid);
}

function getReportCurrentRecognizedAmount(item: RecognitionCardSale, month: string) {
  if (item.category === 'goods') return item.paidAt.startsWith(month) ? item.paid : 0;
  if (item.category === 'storedValue') return getStoredValueConsumptionAmount(item, month);
  return getCurrentRecognizedAmount(item, month);
}

function getReportRecognizedToMonth(item: RecognitionCardSale, month: string) {
  if (getMonthNumber(month) < getMonthNumber(item.paidAt.slice(0, 7))) return 0;
  if (item.category === 'goods') return item.paid;
  if (item.category === 'storedValue') {
    const diff = getMonthNumber(month) - getMonthNumber(item.paidAt.slice(0, 7));
    return Math.min(
      Array.from({ length: diff + 1 }).reduce<number>((sum, _, index) => {
        const m = addMonths(item.paidAt.slice(0, 7), index);
        return sum + getStoredValueConsumptionAmount(item, m);
      }, 0),
      item.paid,
    );
  }
  return getRecognizedToMonth(item, month);
}

function getReportPendingAmount(item: RecognitionCardSale, month: string) {
  if (item.category === 'goods') return 0;
  return Math.max(item.paid - getReportRecognizedToMonth(item, month), 0);
}

function getReportConfirmedPeriods(item: RecognitionCardSale, month: string) {
  if (item.category === 'goods') return item.paidAt.startsWith(month) ? 1 : 0;
  if (item.category === 'storedValue') return getReportCurrentRecognizedAmount(item, month) > 0 ? 1 : 0;
  return Math.min(Math.max(getMonthNumber(month) - getMonthNumber(item.paidAt.slice(0, 7)) + 1, 0), item.periods);
}

function addMonths(month: string, offset: number) {
  const [year, monthValue] = month.split('-').map(Number);
  const date = new Date(year, monthValue - 1 + offset, 1);
  return String(date.getFullYear()) + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

function RecognitionReportCategoryTable({ rows, total, periodLabel }: { rows: ReturnType<typeof recognitionReportCategoryRows>; total: number; periodLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u6536\u5165\u7c7b\u578b'}</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">{periodLabel + '确认收入'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u5360\u6bd4'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{periodLabel + '销售金额'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u671f\u672b\u5f85\u786e\u8ba4\u6536\u5165'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{recognitionCategoryMeta[row.key].name}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.currentRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total > 0 ? ((row.currentRecognized / total) * 100).toFixed(1) + '%' : '0.0%'}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlySalesTotal)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.pending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecognitionReportStoreTable({ rows, periodLabel }: { rows: ReturnType<typeof recognitionReportStoreRows>; periodLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u95e8\u5e97'}</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">{periodLabel + '确认收入'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{periodLabel + '销售金额'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u671f\u672b\u5f85\u786e\u8ba4\u6536\u5165'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.storeName} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.storeName}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.currentRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlySalesTotal)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.pending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecognitionReportProductTable({ rows, periodLabel }: { rows: ReturnType<typeof recognitionReportProductRows>; periodLabel: string }) {
  const total = rows.reduce(
    (sum, row) => ({
      currentRecognized: sum.currentRecognized + row.currentRecognized,
      monthlySalesTotal: sum.monthlySalesTotal + row.monthlySalesTotal,
      pending: sum.pending + row.pending,
    }),
    { currentRecognized: 0, monthlySalesTotal: 0, pending: 0 },
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u9879\u76ee/\u5361\u9879'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u6536\u5165\u7c7b\u578b'}</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">{periodLabel + '确认收入'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{periodLabel + '销售金额'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u671f\u672b\u5f85\u786e\u8ba4\u6536\u5165'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u786e\u8ba4\u671f\u6570'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.product}</td>
              <td className="border-b border-slate-100 px-3 py-3">{recognitionCategoryMeta[row.category].name}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.currentRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlySalesTotal)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.pending)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.periodsLabel}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 text-sm font-black text-slate-900">
            <td className="border-t border-slate-200 px-3 py-3" colSpan={2}>{'\u5408\u8ba1'}</td>
            <td className="border-t border-slate-200 px-3 py-3 text-right tabular-nums text-blue-700">{money(total.currentRecognized)}</td>
            <td className="border-t border-slate-200 px-3 py-3 text-right tabular-nums">{money(total.monthlySalesTotal)}</td>
            <td className="border-t border-slate-200 px-3 py-3 text-right tabular-nums">{money(total.pending)}</td>
            <td className="border-t border-slate-200 px-3 py-3 text-right">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RecognitionReportDetailTable({ rows, periodLabel }: { rows: ReturnType<typeof recognitionReportDetailRows>; periodLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u4f1a\u5458'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u95e8\u5e97'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u6536\u5165\u7c7b\u578b'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u9879\u76ee/\u5361\u9879'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-left">{'\u652f\u4ed8\u6708\u4efd'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u5b9e\u6536\u91d1\u989d'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u786e\u8ba4\u671f\u6570'}</th>
            <th className="border-b border-slate-100 bg-blue-50/50 px-3 py-3 text-right text-blue-700">{periodLabel + '确认收入'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'截至' + periodLabel + '已确认'}</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">{'\u671f\u672b\u5f85\u786e\u8ba4'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.item.id} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.item.member}</td>
              <td className="border-b border-slate-100 px-3 py-3">{fitnessStores.find((item) => item.id === row.item.store)?.name}</td>
              <td className="border-b border-slate-100 px-3 py-3">{recognitionCategoryMeta[row.item.category].name}</td>
              <td className="border-b border-slate-100 px-3 py-3">{row.item.product}</td>
              <td className="border-b border-slate-100 px-3 py-3">{row.item.paidAt.slice(0, 7)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.item.paid)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.item.category === 'storedValue' ? '\u6d88\u8d39\u786e\u8ba4' : row.item.periods}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.currentRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.recognizedToMonth)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.pending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getMonthNumber(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  return year * 12 + monthValue;
}

function getRecognitionPeriodIndex(item: RecognitionCardSale, month: string) {
  const diff = getMonthNumber(month) - getMonthNumber(item.paidAt.slice(0, 7));
  if (diff < 0 || diff >= item.periods) return null;
  return diff;
}

function getPeriodAmount(item: RecognitionCardSale, index: number) {
  const totalCents = Math.round(item.paid * 100);
  const baseCents = Math.floor(totalCents / item.periods);
  const amountCents = index === item.periods - 1 ? totalCents - baseCents * (item.periods - 1) : baseCents;
  return amountCents / 100;
}

function getCurrentRecognizedAmount(item: RecognitionCardSale, month: string) {
  const index = getRecognitionPeriodIndex(item, month);
  return index === null ? 0 : getPeriodAmount(item, index);
}

function getRecognizedToMonth(item: RecognitionCardSale, month: string) {
  const currentIndex = getRecognitionPeriodIndex(item, month);
  const latestIndex = currentIndex === null ? Math.min(Math.max(getMonthNumber(month) - getMonthNumber(item.paidAt.slice(0, 7)), -1), item.periods - 1) : currentIndex;
  if (latestIndex < 0) return 0;
  return Array.from({ length: latestIndex + 1 }).reduce<number>((sum, _, index) => sum + getPeriodAmount(item, index), 0);
}

function getPendingRecognitionAmount(item: RecognitionCardSale, month: string) {
  return Math.max(item.paid - getRecognizedToMonth(item, month), 0);
}

function getCurrentMonthPendingAmount(item: RecognitionCardSale, month: string) {
  if (!item.paidAt.startsWith(month)) return 0;
  return Math.max(item.paid - getCurrentRecognizedAmount(item, month), 0);
}

function recognitionMetrics(items: RecognitionCardSale[], month: string) {
  const currentMonthItems = items.filter((item) => item.paidAt.startsWith(month));
  const activeItems = items.filter((item) => getRecognitionPeriodIndex(item, month) !== null);
  const currentSalesRecognized = currentMonthItems.reduce((sum, item) => sum + (item.category === 'goods' ? item.paid : getCurrentRecognizedAmount(item, month)), 0);
  const historySalesRecognized = activeItems.filter((item) => item.category !== 'goods' && !item.paidAt.startsWith(month)).reduce((sum, item) => sum + getCurrentRecognizedAmount(item, month), 0);
  const monthlyPending = items.filter((item) => item.category !== 'goods').reduce((sum, item) => sum + getCurrentMonthPendingAmount(item, month), 0);
  const historyPending = items.filter((item) => item.category !== 'goods' && !item.paidAt.startsWith(month)).reduce((sum, item) => sum + getPendingRecognitionAmount(item, month), 0);

  return {
    currentSalesRecognized,
    historySalesRecognized,
    currentRecognized: currentSalesRecognized + historySalesRecognized,
    monthlyPending,
    historyPending,
    pending: monthlyPending + historyPending,
    monthlySalesTotal: currentSalesRecognized + monthlyPending,
    orders: currentMonthItems.reduce((sum, item) => sum + item.orders, 0),
  };
}

function groupRecognitionByCategory(activeCards: RecognitionCardSale[], allCards: RecognitionCardSale[], month: string) {
  return (Object.keys(recognitionCategoryMeta) as RecognitionCardSale['category'][]).map((category) => {
    const allByCategory = allCards.filter((item) => item.category === category);
    const metrics = recognitionMetrics(allByCategory, month);
    return {
      key: category,
      ...metrics,
      periods: Math.max(...allByCategory.map((item) => item.periods)),
    };
  });
}

function groupRecognitionByProduct(activeCards: RecognitionCardSale[], allCards: RecognitionCardSale[], category: RecognitionCardSale['category'], month: string) {
  const scopedAllCards = allCards.filter((item) => item.category === category);
  const productNames = Array.from(new Set(scopedAllCards.map((item) => item.product)));
  return productNames.map((product) => {
    const allByProduct = scopedAllCards.filter((item) => item.product === product);
    const metrics = recognitionMetrics(allByProduct, month);
    return {
      key: product,
      ...metrics,
      periods: Math.max(...allByProduct.map((item) => item.periods)),
    };
  });
}

function groupRecognitionByStore(cards: RecognitionCardSale[], selectedStore: StoreId, month: string) {
  return fitnessStores
    .filter((item) => item.id !== 'all' && (selectedStore === 'all' || item.id === selectedStore))
    .map((storeItem) => {
      const scopedCards = cards.filter((item) => item.store === storeItem.id);
      const metrics = recognitionMetrics(scopedCards, month);
      return {
        storeName: storeItem.name,
        ...metrics,
      };
    });
}

function RecognitionCategorySummary({
  rows,
  selectedCategory,
  onSelectCategory,
}: {
  rows: ReturnType<typeof groupRecognitionByCategory>;
  selectedCategory: RecognitionCardSale['category'];
  onSelectCategory: (category: RecognitionCardSale['category']) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {rows.map((row) => {
        const meta = recognitionCategoryMeta[row.key];
        const Icon = meta.icon;
        const active = selectedCategory === row.key;
        return (
          <button
            key={row.key}
            onClick={() => onSelectCategory(row.key)}
            className={cn('rounded-lg border bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/30', active ? 'border-blue-200 bg-blue-50/60 ring-1 ring-blue-100' : 'border-slate-100')}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-slate-800">{recognitionCategoryRevenueTitle[row.key]}</div>
                <div className="mt-1 truncate text-2xl font-black tracking-normal text-blue-700">{money(row.currentRecognized)}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="min-w-0 rounded bg-slate-50 px-2 py-2">
                <div className="truncate text-slate-400">当前区间新售确认</div>
                <div className="mt-1 truncate text-sm font-black text-slate-700">{money(row.currentSalesRecognized)}</div>
              </div>
              <div className="min-w-0 rounded bg-slate-50 px-2 py-2">
                <div className="truncate text-slate-400">往期销售确认</div>
                <div className="mt-1 truncate text-sm font-black text-slate-700">{money(row.historySalesRecognized)}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RecognitionProductTable({ rows, category }: { rows: ReturnType<typeof groupRecognitionByProduct>; category: RecognitionCardSale['category'] }) {
  const meta = recognitionCategoryMeta[category];
  const total = rows.reduce(
    (sum, row) => ({
      currentRecognized: sum.currentRecognized + row.currentRecognized,
      monthlySalesTotal: sum.monthlySalesTotal + row.monthlySalesTotal,
      pending: sum.pending + row.pending,
      currentSalesRecognized: sum.currentSalesRecognized + row.currentSalesRecognized,
      monthlyPending: sum.monthlyPending + row.monthlyPending,
      historySalesRecognized: sum.historySalesRecognized + row.historySalesRecognized,
      historyPending: sum.historyPending + row.historyPending,
    }),
    { currentRecognized: 0, monthlySalesTotal: 0, pending: 0, currentSalesRecognized: 0, monthlyPending: 0, historySalesRecognized: 0, historyPending: 0 },
  );

  return (
    <div>
      <div className="mb-3 text-sm font-black text-slate-800">销售明细</div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">统计项目</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">当前区间确认收入</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间销售金额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间新售确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间新售待确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">往期销售确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">往期销售待确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">确认期数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.key}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.currentRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlySalesTotal)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.currentSalesRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlyPending)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.historySalesRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.historyPending)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.periods}</td>
            </tr>
          ))}
          <tr className="font-black text-slate-900">
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3">合计</td>
            <td className="border-b border-slate-100 bg-blue-50 px-3 py-3 text-right tabular-nums text-blue-700">{money(total.currentRecognized)}</td>
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums">{money(total.monthlySalesTotal)}</td>
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums">{money(total.currentSalesRecognized)}</td>
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums">{money(total.monthlyPending)}</td>
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums">{money(total.historySalesRecognized)}</td>
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums">{money(total.historyPending)}</td>
            <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums">-</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}

function RecognitionStoreTable({ rows }: { rows: ReturnType<typeof groupRecognitionByStore> }) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, 6);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="border-b border-slate-100 px-3 py-3 text-left">门店</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">当前区间确认收入</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间销售金额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间新售确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间新售待确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">往期销售确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">往期销售待确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">确认期数</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.storeName} className="font-bold text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">{row.storeName}</td>
              <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(row.currentRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlySalesTotal)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.currentSalesRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.monthlyPending)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.historySalesRecognized)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.historyPending)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">-</td>
            </tr>
          ))}
          {rows.length > 6 && (
            <tr>
              <td colSpan={7} className="px-3 py-3 text-center">
                <button onClick={() => setExpanded((value) => !value)} className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">
                  {expanded ? '收起' : '查看更多'}
                  <ChevronDown size={15} className={cn('transition', expanded && 'rotate-180')} />
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RecognitionDetailTable({ rows, month }: { rows: RecognitionCardSale[]; month: string }) {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(Math.ceil(rows.length / pageSize), 1);
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const visibleRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">会员</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">门店</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">销售分类</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">卡项</th>
              <th className="border-b border-slate-100 px-3 py-3 text-left">支付时间</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">实收金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">确认期数</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">截至当前区间已确认期数</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">待确认期数</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">当前区间确认收入</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间销售金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">待确认收入余额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">当前区间新售确认</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">往期确认</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isCurrentMonthSale = row.paidAt.startsWith(month);
              const currentAmount = row.category === 'goods' ? row.paid : getCurrentRecognizedAmount(row, month);
              const newSaleRecognized = isCurrentMonthSale ? currentAmount : 0;
              const historyRecognized = !isCurrentMonthSale && row.category !== 'goods' ? currentAmount : 0;
              const currentMonthPending = getCurrentMonthPendingAmount(row, month);
              const monthlySales = newSaleRecognized + currentMonthPending;
              const pending = row.category === 'goods' ? 0 : getPendingRecognitionAmount(row, month);
              const confirmedPeriods = row.category === 'goods' ? row.periods : Math.min(Math.max(getMonthNumber(month) - getMonthNumber(row.paidAt.slice(0, 7)) + 1, 0), row.periods);
              const pendingPeriods = Math.max(row.periods - confirmedPeriods, 0);
              return (
                <tr key={row.id} className="font-bold text-slate-800">
                  <td className="border-b border-slate-100 px-3 py-3">{row.member}</td>
                  <td className="border-b border-slate-100 px-3 py-3">{fitnessStores.find((item) => item.id === row.store)?.name}</td>
                  <td className="border-b border-slate-100 px-3 py-3">{recognitionCategoryMeta[row.category].name}</td>
                  <td className="border-b border-slate-100 px-3 py-3">{row.product}</td>
                  <td className="border-b border-slate-100 px-3 py-3">{row.paidAt}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(row.paid)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{row.periods}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{confirmedPeriods}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{pendingPeriods}</td>
                  <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(newSaleRecognized + historyRecognized)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(monthlySales)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(pending)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(newSaleRecognized)}</td>
                  <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(historyRecognized)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
        <div>
          共 {rows.length} 条，显示 {rows.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, rows.length)} 条
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
            disabled={safePage === 1}
            className="h-8 rounded-md border border-slate-200 px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一页
          </button>
          <span className="px-2 text-slate-700">
            {safePage} / {pageCount}
          </span>
          <button
            onClick={() => setPage((value) => Math.min(value + 1, pageCount))}
            disabled={safePage === pageCount}
            className="h-8 rounded-md border border-slate-200 px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}

function buildRevenuePrepaidRows(orders: RevenueOrder[]): RevenuePrepaidRow[] {
  const grouped = new Map<'storedCard' | 'balanceRecharge', RevenuePrepaidRow>();
  orders.filter((order) => order.project === 'storedCard').forEach((order) => {
    splitPrepaidOrderAmount(order).forEach((item) => {
      const current = grouped.get(item.key) ?? { key: item.key, sales: 0, refund: 0, netAmount: 0, orders: 0 };
      current.sales += item.sales;
      current.refund += item.refund;
      current.netAmount += item.netAmount;
      current.orders += item.orders;
      grouped.set(item.key, current);
    });
  });
  return Array.from(grouped.values()).filter((row) => row.sales > 0).sort((a, b) => b.netAmount - a.netAmount);
}

function buildRevenuePrepaidItemRows(orders: RevenueOrder[]): RevenuePrepaidItemRow[] {
  const grouped = new Map<string, RevenuePrepaidItemRow>();
  orders.filter((order) => order.project === 'storedCard').forEach((order) => {
    splitPrepaidOrderAmount(order).forEach((item) => {
      const itemName = projectBreakdownMeta[item.key].name;
      const key = [order.store, item.key, order.source].join('|');
      const current = grouped.get(key) ?? { store: order.store, source: order.source, itemName, key: item.key, sales: 0, refund: 0, netAmount: 0, orders: 0 };
      current.sales += item.sales;
      current.refund += item.refund;
      current.netAmount += item.netAmount;
      current.orders += item.orders;
      grouped.set(key, current);
    });
  });
  return Array.from(grouped.values()).filter((row) => row.sales > 0).sort((a, b) => {
    const storeCompare = stores.findIndex((item) => item.id === a.store) - stores.findIndex((item) => item.id === b.store);
    if (storeCompare !== 0) return storeCompare;
    if (a.key !== b.key) return a.key === 'storedCard' ? -1 : 1;
    return b.netAmount - a.netAmount;
  });
}

function splitPrepaidOrderAmount(order: RevenueOrder) {
  const weights = [0.68, 0.32];
  const keys = ['storedCard', 'balanceRecharge'] as const;
  let usedSales = 0;
  let usedRefund = 0;
  let usedOrders = 0;

  return weights.map((weight, index) => {
    const isLast = index === weights.length - 1;
    const sales = isLast ? order.paid - usedSales : Math.round(order.paid * weight);
    const refund = isLast ? (order.refund ?? 0) - usedRefund : Math.round((order.refund ?? 0) * weight);
    const orderCount = isLast ? order.orders - usedOrders : Math.round(order.orders * weight);
    usedSales += sales;
    usedRefund += refund;
    usedOrders += orderCount;
    return {
      key: keys[index],
      sales,
      refund,
      netAmount: Math.max(sales - refund, 0),
      orders: Math.max(orderCount, 0),
    };
  });
}

function summarizeRevenueComposition(rows: RevenueOrder[]) {
  const base = rows.reduce(
    (acc, row) => {
      const isThirdPartyGroup = row.payment === 'meituanGroup' || row.payment === 'douyinGroup';
      const isStoredBalance = row.payment === 'storedBalance';
      const isPlatform = isPlatformRevenueOrder(row);
      const refund = row.refund ?? 0;

      acc.receivable += row.receivable;
      acc.discount += row.discount;
      acc.orders += row.orders;

      if (isPlatform) {
        acc.sales += row.paid;
        acc.refund += refund;
      }

      if (isStoredBalance) acc.storedBalance += row.paid;

      if (isThirdPartyGroup) {
        acc.thirdPartyGroup += row.paid;
        if (row.payment === 'meituanGroup') acc.meituan += row.paid;
        if (row.payment === 'douyinGroup') acc.douyin += row.paid;
      }

      return acc;
    },
    { receivable: 0, discount: 0, sales: 0, refund: 0, storedBalance: 0, storedCardRevenue: 0, meituan: 0, douyin: 0, thirdPartyGroup: 0, orders: 0 },
  );
  const actualRevenue = Math.max(base.sales - base.refund, 0);
  const businessAmount = actualRevenue + base.storedBalance + base.thirdPartyGroup;

  return {
    ...base,
    actualRevenue,
    businessAmount,
    channelAmount: businessAmount,
  };
}

function summarizeRevenueCompositionTotals(totals: ReturnType<typeof summarizeRevenueComposition>[]) {
  return totals.reduce(
    (acc, item) => ({
      receivable: acc.receivable + item.receivable,
      discount: acc.discount + item.discount,
      sales: acc.sales + item.sales,
      refund: acc.refund + item.refund,
      storedBalance: acc.storedBalance + item.storedBalance,
      storedCardRevenue: acc.storedCardRevenue + item.storedCardRevenue,
      meituan: acc.meituan + item.meituan,
      douyin: acc.douyin + item.douyin,
      thirdPartyGroup: acc.thirdPartyGroup + item.thirdPartyGroup,
      orders: acc.orders + item.orders,
      actualRevenue: acc.actualRevenue + item.actualRevenue,
      businessAmount: acc.businessAmount + item.businessAmount,
      channelAmount: acc.channelAmount + item.channelAmount,
    }),
    summarizeRevenueComposition([]),
  );
}

function groupByRevenueComposition<T extends keyof RevenueOrder>(rows: RevenueOrder[], key: T) {
  const grouped = new Map<string, RevenueOrder[]>();
  rows.forEach((row) => {
    const value = String(row[key]);
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([groupKey, groupRows]) => ({ key: groupKey, total: summarizeRevenueComposition(groupRows) }))
    .filter((row) => row.total.businessAmount > 0)
    .sort((a, b) => b.total.businessAmount - a.total.businessAmount);
}

function summarize(rows: RevenueOrder[]) {
  const base = rows.reduce(
    (acc, row) => {
      const isThirdPartyGroup = row.payment === 'meituanGroup' || row.payment === 'douyinGroup';
      acc.receivable += row.receivable;
      acc.discount += row.discount;
      acc.orders += row.orders;

      acc.sales += row.paid;
      acc.refund += row.refund ?? 0;

      if (isThirdPartyGroup) {
        acc.thirdPartyGroup += row.paid;
        if (row.payment === 'meituanGroup') acc.meituan += row.paid;
        if (row.payment === 'douyinGroup') acc.douyin += row.paid;
        return acc;
      }

      if (row.payment === 'storedBalance') acc.storedBalance += row.paid;
      if (row.project === 'storedCard') acc.storedCardRevenue += row.paid;
      return acc;
    },
    { receivable: 0, discount: 0, sales: 0, refund: 0, storedBalance: 0, storedCardRevenue: 0, meituan: 0, douyin: 0, thirdPartyGroup: 0, orders: 0 },
  );

  return {
    ...base,
    actualRevenue: base.sales - base.refund - base.storedBalance,
    businessAmount: base.sales,
    channelAmount: base.sales,
  };
}

function summarizeTotals(totals: ReturnType<typeof summarize>[]) {
  return totals.reduce(
    (acc, item) => ({
      receivable: acc.receivable + item.receivable,
      discount: acc.discount + item.discount,
      sales: acc.sales + item.sales,
      refund: acc.refund + item.refund,
      storedBalance: acc.storedBalance + item.storedBalance,
      storedCardRevenue: acc.storedCardRevenue + item.storedCardRevenue,
      meituan: acc.meituan + item.meituan,
      douyin: acc.douyin + item.douyin,
      thirdPartyGroup: acc.thirdPartyGroup + item.thirdPartyGroup,
      orders: acc.orders + item.orders,
      actualRevenue: acc.actualRevenue + item.actualRevenue,
      businessAmount: acc.businessAmount + item.businessAmount,
      channelAmount: acc.channelAmount + item.channelAmount,
    }),
    summarize([]),
  );
}

function groupBySport(rows: RevenueOrder[]) {
  const grouped = new Map<string, RevenueOrder[]>();
  rows.forEach((row) => {
    const value = getSportProject(row);
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([groupKey, groupRows]) => ({ key: groupKey, total: summarize(groupRows) }))
    .sort((a, b) => b.total.actualRevenue - a.total.actualRevenue);
}

function getSportProject(order: RevenueOrder) {
  if (order.store === 'river') return 'swimmingVenue';
  if (order.store === 'east') return 'fitnessVenue';
  if (order.id.endsWith('9') || order.id.endsWith('7')) return 'basketballVenue';
  return 'badmintonVenue';
}

function groupBy<T extends keyof RevenueOrder>(rows: RevenueOrder[], key: T) {
  const grouped = new Map<string, RevenueOrder[]>();
  rows.forEach((row) => {
    const value = String(row[key]);
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([groupKey, groupRows]) => ({ key: groupKey, total: summarize(groupRows) }))
    .sort((a, b) => b.total.businessAmount - a.total.businessAmount);
}

function orderProjectRows(rows: { key: string; total: ReturnType<typeof summarize> }[]) {
  return [...rows].sort((a, b) => {
    if (a.key === 'passCard') return -1;
    if (b.key === 'passCard') return 1;
    return b.total.businessAmount - a.total.businessAmount;
  });
}

function Segmented({
  value,
  customRange,
  onChange,
  onCustomRangeChange,
}: {
  value: Period;
  customRange: CustomDateRange;
  onChange: (value: Period) => void;
  onCustomRangeChange: (range: CustomDateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<CustomDateRange>(customRange);
  const [leftMonth, setLeftMonth] = useState(() => startOfMonth(parseIsoDate(customRange.start)));
  const rightMonth = addCalendarMonths(leftMonth, 1);
  const quickRanges = [
    { label: '今日', start: '2026-06-22', end: '2026-06-22' },
    { label: '昨日', start: '2026-06-21', end: '2026-06-21' },
    { label: '明日', start: '2026-06-23', end: '2026-06-23' },
    { label: '本周', start: '2026-06-22', end: '2026-06-28' },
    { label: '上周', start: '2026-06-15', end: '2026-06-21' },
    { label: '本月', start: '2026-06-01', end: '2026-06-30' },
    { label: '上月', start: '2026-05-01', end: '2026-05-31' },
    { label: '今年', start: '2026-01-01', end: '2026-12-31' },
    { label: '过去 7 天', start: '2026-06-16', end: '2026-06-22' },
    { label: '过去 14 天', start: '2026-06-09', end: '2026-06-22' },
    { label: '未来 7 天', start: '2026-06-22', end: '2026-06-28' },
    { label: '未来 14 天', start: '2026-06-22', end: '2026-07-05' },
    { label: '过去', start: '2026-01-01', end: '2026-06-21' },
    { label: '未来', start: '2026-06-23', end: '2026-12-31' },
    { label: '静态', start: '2026-05-01', end: '2026-06-30' },
  ];

  const openCustomPicker = () => {
    setDraftRange(customRange);
    setLeftMonth(startOfMonth(parseIsoDate(customRange.start)));
    setOpen(true);
  };

  const applyQuickRange = (range: CustomDateRange) => {
    setDraftRange(range);
    setLeftMonth(startOfMonth(parseIsoDate(range.start)));
  };

  const selectDate = (date: Date) => {
    const selected = isoFromDate(date);
    setDraftRange((range) => {
      if (!range.start || range.end) {
        return { start: selected, end: '' };
      }
      if (selected < range.start) {
        return { start: selected, end: range.start };
      }
      return { start: range.start, end: selected };
    });
  };

  const applyCustomRange = () => {
    const nextRange = draftRange.end ? draftRange : { ...draftRange, end: draftRange.start };
    onCustomRangeChange(nextRange);
    onChange('custom');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex h-10 rounded-md bg-white p-1 ring-1 ring-slate-200">
        {periods.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'custom') {
                openCustomPicker();
                return;
              }
              setOpen(false);
              onChange(item.id);
            }}
            className={cn('min-w-16 rounded px-3 text-sm font-bold', value === item.id ? 'bg-blue-600 text-white' : 'text-slate-600')}
          >
            {item.name}
          </button>
        ))}
      </div>

      {open && (
        <div className="absolute left-0 top-12 z-30 w-[1520px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div className="text-2xl font-black text-slate-900">选择日期范围</div>
            <div className="flex flex-wrap items-center gap-3 text-lg font-bold text-slate-400">
              <span>{draftRange.start || '开始日期'}</span>
              <div className="flex h-16 w-48 items-center justify-between rounded-md border border-slate-200 bg-white px-5 text-2xl font-medium text-slate-900">
                00:00:00
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 text-xs text-slate-400">⌚</span>
              </div>
              <span>～</span>
              <span>{draftRange.end || '结束日期'}</span>
              <div className="flex h-16 w-48 items-center justify-between rounded-md border border-slate-200 bg-white px-5 text-2xl font-medium text-slate-900">
                23:59:59
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 text-xs text-slate-400">⌚</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="h-12 rounded-md bg-slate-100 px-4 text-xl font-bold text-slate-800">取消</button>
              <button onClick={applyCustomRange} className="h-12 rounded-md bg-blue-500 px-4 text-xl font-bold text-white">确定</button>
            </div>
          </div>

          <div className="grid gap-7 px-6 py-6 lg:grid-cols-[342px_1fr_1fr]">
            <DatePickerColumnTitle title="快捷选择" />
            <DatePickerColumnTitle title="开始日期" />
            <DatePickerColumnTitle title="结束日期" />

            <div className="grid grid-cols-2 gap-2">
              {quickRanges.map((item) => {
                const active = draftRange.start === item.start && draftRange.end === item.end;
                return (
                  <button
                    key={item.label}
                    onClick={() => applyQuickRange({ start: item.start, end: item.end })}
                    className={cn('h-[57px] rounded-md text-2xl font-bold', active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200')}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <DateMonthPanel
              month={leftMonth}
              range={draftRange}
              onPrevYear={() => setLeftMonth(addCalendarMonths(leftMonth, -12))}
              onPrevMonth={() => setLeftMonth(addCalendarMonths(leftMonth, -1))}
              onNextMonth={() => setLeftMonth(addCalendarMonths(leftMonth, 1))}
              onNextYear={() => setLeftMonth(addCalendarMonths(leftMonth, 12))}
              onSelect={selectDate}
            />
            <DateMonthPanel
              month={rightMonth}
              range={draftRange}
              onPrevYear={() => setLeftMonth(addCalendarMonths(leftMonth, -12))}
              onPrevMonth={() => setLeftMonth(addCalendarMonths(leftMonth, -1))}
              onNextMonth={() => setLeftMonth(addCalendarMonths(leftMonth, 1))}
              onNextYear={() => setLeftMonth(addCalendarMonths(leftMonth, 12))}
              onSelect={selectDate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DatePickerColumnTitle({ title }: { title: string }) {
  return (
    <div className="relative flex h-7 items-center justify-center text-2xl font-bold text-slate-400">
      <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
      <span className="relative bg-white px-6">{title}</span>
    </div>
  );
}

function DateMonthPanel({
  month,
  range,
  onPrevYear,
  onPrevMonth,
  onNextMonth,
  onNextYear,
  onSelect,
}: {
  month: Date;
  range: CustomDateRange;
  onPrevYear: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onNextYear: () => void;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="relative border border-slate-200 bg-white p-4">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[180px] font-black text-slate-100/70">
        {month.getMonth() + 1}
      </div>
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between px-4 text-3xl font-bold text-slate-900">
          <div className="flex gap-6 text-4xl font-light">
            <button onClick={onPrevYear} className="leading-none">‹</button>
            <button onClick={onPrevMonth} className="leading-none">‹</button>
          </div>
          <div>{formatMonthTitle(month)}</div>
          <div className="flex gap-6 text-4xl font-light">
            <button onClick={onNextMonth} className="leading-none">›</button>
            <button onClick={onNextYear} className="leading-none">›</button>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-7 rounded-md bg-slate-100 py-3 text-center text-2xl font-bold text-slate-800">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-3 text-center">
          {monthCalendarDays(month).map((item, index) => {
            const iso = isoFromDate(item.date);
            const selected = iso === range.start || iso === range.end;
            const inRange = isDateInRange(iso, range);
            return (
              <button
                key={`${iso}-${index}`}
                onClick={() => onSelect(item.date)}
                className={cn(
                  'mx-auto flex h-12 w-16 items-center justify-center rounded-md text-3xl font-medium',
                  item.inMonth ? 'text-slate-900' : 'text-slate-200',
                  inRange && !selected ? 'bg-blue-50 text-blue-700' : '',
                  selected ? 'bg-blue-500 text-white' : '',
                )}
              >
                {item.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getActivePeriod(period: Period, customRange: CustomDateRange) {
  const current = periods.find((item) => item.id === period)!;
  return period === 'custom' ? { ...current, range: formatDateRange(customRange) } : current;
}

function formatDateRange(range: CustomDateRange) {
  return range.start === range.end ? range.start : `${range.start} 至 ${range.end}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isoFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addCalendarMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()} 年 ${String(date.getMonth() + 1).padStart(2, '0')} 月`;
}

function monthCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1 - mondayIndex);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

function isDateInRange(iso: string, range: CustomDateRange) {
  if (!range.start || !range.end) return false;
  return iso > range.start && iso < range.end;
}

function SelectBox({ icon: Icon, value, onChange, options }: { icon: typeof Store; value: string; onChange: (value: string) => void; options: { id: string; name: string }[] }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
      <Icon size={16} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent outline-none">
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function IconAction({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600" title={label} aria-label={label}>
      {children}
    </button>
  );
}

function MetricCard({
  title,
  value,
  helper,
  accent,
  large,
  details,
}: {
  title: string;
  value: string;
  helper?: string;
  accent?: string;
  large?: boolean;
  details?: { label: string; value: string }[];
}) {
  return (
    <div className={cn('flex min-h-36 flex-col rounded-lg border border-slate-100 bg-white p-3.5 shadow-sm shadow-slate-200/40', accent)}>
      <div className={cn('text-xs font-bold', accent ? 'text-white/70' : 'text-slate-500')}>{title}</div>
      <div className={cn('mt-1.5 font-black tracking-normal', large ? 'text-2xl' : 'text-xl')}>{value}</div>
      {helper && <div className={cn('mt-1.5 text-[11px] font-semibold leading-5', accent ? 'text-white/65' : 'text-slate-500')}>{helper}</div>}
      {details && (
        <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
          {details.map((item) => (
            <div key={item.label} className={cn('min-w-0 rounded px-2 py-1.5 text-[11px] font-bold', accent ? 'bg-white/10' : 'bg-slate-50')}>
              <div className={cn('truncate', accent ? 'text-white/65' : 'text-slate-500')}>{item.label}</div>
              <div className={cn('mt-0.5 truncate tabular-nums', accent ? 'text-white' : 'text-slate-800')}>{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RevenueTotalCard({
  total,
  miniProgramRevenue,
  cashierRevenue,
}: {
  total: number;
  miniProgramRevenue: number;
  cashierRevenue: number;
  meituanRevenue: number;
  douyinRevenue: number;
}) {
  const items = [
    { label: '小程序平台收款', value: miniProgramRevenue },
    { label: '收银台平台收款', value: cashierRevenue },
  ];

  return (
    <div className="rounded-lg border border-blue-500 bg-blue-600 p-4 text-white shadow-sm shadow-blue-200/60">
      <div className="text-xs font-bold text-white/70">平台营收金额</div>
      <div className="mt-1.5 text-4xl font-black tracking-normal">{money(total)}</div>
      <div className="mt-2 text-[11px] font-semibold text-white/65">销售总额 - 退款金额 - 储值卡/余额支付</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-white/10 px-2.5 py-2.5">
            <div className="text-[11px] font-bold text-white/65">{item.label}</div>
            <div className="mt-1 text-base font-black">{money(item.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesBreakdownCards({ sales, storedBalance, actualRevenue, refund }: {
  sales: number;
  storedBalance: number;
  actualRevenue: number;
  refund: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-100 bg-white p-3.5 shadow-sm shadow-slate-200/40">
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-bold text-slate-500">销售总额</div>
          <div className="mt-2 text-3xl font-black tracking-normal text-slate-800">{money(sales)}</div>
          <div className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">含储值卡/余额支付</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-bold text-slate-500">储值卡/余额支付</div>
          <div className="mt-2 text-3xl font-black tracking-normal text-slate-800">{money(storedBalance)}</div>
          <div className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">用于扣减营收</div>
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
        销售总额 {money(sales)} - 退款金额 {money(refund)} - 储值卡/余额支付 {money(storedBalance)} = 平台营收金额 {money(actualRevenue)}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, action, subtitle, children }: { title: string; icon: typeof Store; action?: ReactNode; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex min-h-11 items-center justify-between border-b border-slate-100 px-3.5">
        <div className="flex flex-wrap items-center gap-2 text-lg font-black">
          <Icon size={17} />
          {title}
          {subtitle && <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{subtitle}</span>}
        </div>
        {action && <div className="text-xs font-bold text-slate-400">{action}</div>}
      </div>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs">
      <span className="font-black text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function ProjectSummary({
  rows,
  orders,
  selectedProject,
  onSelectProject,
  dashboard,
}: {
  rows: { key: string; total: ReturnType<typeof summarize> }[];
  orders: RevenueOrder[];
  selectedProject: Project;
  onSelectProject: (project: Project) => void;
  dashboard: DashboardType;
}) {
  const sourceOrder: Source[] = ['miniProgram', 'cashier', 'meituan', 'douyin'];
  const selectedRow = rows.find((row) => row.key === selectedProject) ?? rows[0];
  const selectedTotal = selectedRow?.total ?? summarize([]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => {
          const project = row.key as Project;
          const item = projectMeta[project];
          const Icon = item.icon;
          const active = selectedProject === project;
          const sourceTotals = sourceOrder.map((source) => ({
            source,
            total: summarize(orders.filter((order) => order.project === row.key && order.source === source)),
          }));

          return (
            <button
              key={row.key}
              onClick={() => onSelectProject(project)}
              className={cn('rounded-lg border bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/30', active ? 'border-blue-200 bg-blue-50/60 ring-1 ring-blue-100' : 'border-slate-100')}
            >
              <div className="flex items-center gap-2">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white', item.color)}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-slate-700">{item.name}</div>
                  <div className="mt-0.5 text-[11px] font-bold text-slate-400">{row.total.orders} 单</div>
                </div>
              </div>
              <div className="mt-2 text-xl font-black text-slate-800">{money(row.total.businessAmount)}</div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">经营发生额</div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-semibold">
                <div className="min-w-0 rounded bg-white/70 px-1.5 py-1">
                  <div className="truncate text-slate-400">销售额</div>
                  <div className="mt-0.5 truncate text-slate-600">{money(row.total.sales)}</div>
                </div>
                <div className="min-w-0 rounded bg-white/70 px-1.5 py-1">
                  <div className="truncate text-slate-400">第三方团购核销额</div>
                  <div className="mt-0.5 truncate text-slate-600">{money(row.total.thirdPartyGroup)}</div>
                </div>
                {sourceTotals.map(({ source, total }) => (
                  <div key={source} className="min-w-0 rounded bg-white/70 px-1.5 py-1">
                    <div className="truncate text-slate-400">
                      {sourceMeta[source].name}
                    </div>
                    <div className="mt-0.5 truncate text-slate-600">{money(total.channelAmount)}</div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selectedRow && <ProjectDetailStats project={selectedProject} total={selectedTotal} dashboard={dashboard} />}
    </div>
  );
}

function ProjectDetailStats({ project, total, dashboard }: { project: Project; total: ReturnType<typeof summarize>; dashboard: DashboardType }) {
  const [expanded, setExpanded] = useState(false);
  const details = buildProjectDetails(project, total);
  const visibleDetails = expanded ? details : details.slice(0, 4);
  const meta = projectMeta[project];
  const isFitness = dashboard === 'fitness';

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-black text-slate-800">{meta.name}明细统计</div>
          <div className="mt-1 text-xs font-bold text-slate-500">点击项目卡片切换明细，主要统计口径为经营发生额，经营营收与第三方团购核销分列展示。</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-bold text-white">
            <Download size={15} />
            导出
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
        <table className={cn('w-full border-separate border-spacing-0 text-sm', isFitness ? 'min-w-[520px]' : 'min-w-[840px]')}>
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">明细项目</th>
              {!isFitness && <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">销售额</th>}
              {!isFitness && <th className="border-b border-slate-100 px-3 py-3 text-right text-amber-700">第三方团购核销额</th>}
              {!isFitness && <th className="border-b border-slate-100 px-3 py-3 text-right text-slate-800">经营发生额</th>}
              <th className="border-b border-slate-100 px-3 py-3 text-right text-indigo-700">平台营收金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">订单数</th>
            </tr>
          </thead>
          <tbody>
            {visibleDetails.map((detail) => (
              <tr key={detail.name} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{detail.name}</td>
                {!isFitness && <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(detail.sales)}</td>}
                {!isFitness && <td className="border-b border-slate-100 bg-amber-50/50 px-3 py-3 text-right tabular-nums text-amber-700">{money(detail.thirdPartyGroup)}</td>}
                {!isFitness && <td className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right tabular-nums text-slate-800">{money(detail.businessAmount)}</td>}
                <td className="border-b border-slate-100 bg-indigo-50/40 px-3 py-3 text-right tabular-nums text-indigo-700">{money(detail.actualRevenue)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{detail.orders}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 text-sm font-black text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">合计</td>
              {!isFitness && <td className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right tabular-nums text-blue-700">{money(total.sales)}</td>}
              {!isFitness && <td className="border-b border-slate-100 bg-amber-50/70 px-3 py-3 text-right tabular-nums text-amber-700">{money(total.thirdPartyGroup)}</td>}
              {!isFitness && <td className="border-b border-slate-100 bg-slate-100 px-3 py-3 text-right tabular-nums">{money(total.businessAmount)}</td>}
              <td className="border-b border-slate-100 bg-indigo-50/60 px-3 py-3 text-right tabular-nums text-indigo-700">{money(total.actualRevenue)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.orders}</td>
            </tr>
            {details.length > 4 && (
              <tr>
                <td colSpan={isFitness ? 3 : 6} className="px-3 py-3 text-center">
                  <button onClick={() => setExpanded((value) => !value)} className="inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm font-bold text-blue-700 hover:bg-blue-50">
                    {expanded ? '收起' : '查看更多'}
                    <ChevronDown size={15} className={cn('transition', expanded && 'rotate-180')} />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildProjectDetails(project: Project, total: ReturnType<typeof summarize>) {
  return projectDetailCatalog[project].map((item, index, list) => {
    const isLast = index === list.length - 1;
    const usedReceivable = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.receivable * current.weight), 0);
    const usedDiscount = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.discount * current.weight), 0);
    const usedSales = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.sales * current.weight), 0);
    const usedStoredBalance = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.storedBalance * current.weight), 0);
    const usedThirdPartyGroup = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.thirdPartyGroup * current.weight), 0);
    const usedBusinessAmount = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.businessAmount * current.weight), 0);
    const usedRevenue = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.actualRevenue * current.weight), 0);
    const usedOrders = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.orders * current.weight), 0);

    return {
      name: item.name,
      receivable: isLast ? Math.max(total.receivable - usedReceivable, 0) : Math.round(total.receivable * item.weight),
      discount: isLast ? Math.max(total.discount - usedDiscount, 0) : Math.round(total.discount * item.weight),
      sales: isLast ? Math.max(total.sales - usedSales, 0) : Math.round(total.sales * item.weight),
      storedBalance: isLast ? Math.max(total.storedBalance - usedStoredBalance, 0) : Math.round(total.storedBalance * item.weight),
      thirdPartyGroup: isLast ? Math.max(total.thirdPartyGroup - usedThirdPartyGroup, 0) : Math.round(total.thirdPartyGroup * item.weight),
      businessAmount: isLast ? Math.max(total.businessAmount - usedBusinessAmount, 0) : Math.round(total.businessAmount * item.weight),
      actualRevenue: isLast ? Math.max(total.actualRevenue - usedRevenue, 0) : Math.round(total.actualRevenue * item.weight),
      orders: isLast ? Math.max(total.orders - usedOrders, 0) : Math.round(total.orders * item.weight),
    };
  });
}

function DataTable({ rows, type, total, dashboard }: { rows: { key: string; total: ReturnType<typeof summarize> }[]; type: Tab; total: number; dashboard: DashboardType }) {
  const isFitness = dashboard === 'fitness';

  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-separate border-spacing-0 text-left text-sm', isFitness ? 'min-w-[520px]' : 'min-w-[760px]')}>
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="w-[210px] border-b border-slate-100 py-3 pr-2">{tableTitle(type)}</th>
            {!isFitness && <th className="border-b border-slate-100 px-2 py-3 text-right text-blue-700">销售额</th>}
            {!isFitness && <th className="border-b border-slate-100 px-2 py-3 text-right text-amber-700">第三方团购核销额</th>}
            <th className="border-b border-slate-100 px-2 py-3 text-right text-slate-800">经营发生额</th>
            <th className="border-b border-slate-100 px-2 py-3 text-right text-indigo-700">平台营收金额</th>
            <th className="border-b border-slate-100 py-3 pl-2 text-right">订单数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="font-bold text-slate-800">
              <td className="w-[210px] border-b border-slate-100 py-3 pr-2">
                <RowName rowKey={row.key} type={type} />
              </td>
              {!isFitness && <td className="border-b border-slate-100 bg-blue-50/40 px-2 py-3 text-right tabular-nums text-blue-700">{money(row.total.sales)}</td>}
              {!isFitness && <td className="border-b border-slate-100 bg-amber-50/50 px-2 py-3 text-right tabular-nums text-amber-700">{money(row.total.thirdPartyGroup)}</td>}
              <td className="border-b border-slate-100 bg-slate-50 px-2 py-3 text-right tabular-nums text-slate-800">{money(row.total.businessAmount)}</td>
              <td className="border-b border-slate-100 bg-indigo-50/40 px-2 py-3 text-right tabular-nums text-indigo-700">{money(row.total.actualRevenue)}</td>
              <td className="border-b border-slate-100 py-3 pl-2 text-right tabular-nums">
                {row.total.orders}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowName({ rowKey, type, compact }: { rowKey: string; type: Tab | 'project' | 'sport' | 'source' | 'payment'; compact?: boolean }) {
  if (type === 'project') {
    const item = projectBreakdownMeta[rowKey] ?? projectMeta[rowKey as Project];
    const Icon = item.icon;
    return (
      <div className="flex min-w-0 items-center gap-2">
        {!compact && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-md text-white', item.color)}>
            <Icon size={16} />
          </span>
        )}
        <span className="truncate">{item.name}</span>
      </div>
    );
  }

  if (type === 'sport') {
    const item = sportMeta[rowKey] ?? { name: rowKey, color: 'bg-slate-400' };
    return (
      <div className="flex min-w-0 items-center gap-2">
        {!compact && <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />}
        <span className="truncate">{item.name}</span>
      </div>
    );
  }

  if (type === 'source') {
    const item = sourceMeta[rowKey as Source];
    return (
      <div className="flex min-w-0 items-center gap-2">
        {!compact && <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />}
        <span className="truncate">{item.name}</span>
        {item.tag && !compact && <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">{item.tag}</span>}
      </div>
    );
  }

  if (type === 'payment') {
    const item = paymentMeta[rowKey as Payment];
    const Icon = item.icon;
    return (
      <div className="flex min-w-0 items-start gap-2">
        {!compact && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <Icon size={16} />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate">{item.name}</span>
          {!compact && (
            <span className={cn('mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px]', item.settlement === 'platform' ? 'bg-blue-50 text-blue-700' : item.settlement === 'merchant' ? 'bg-emerald-50 text-emerald-700' : item.settlement === 'thirdParty' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500')}>
              {item.note}
            </span>
          )}
        </span>
      </div>
    );
  }

  return stores.find((item) => item.id === rowKey)?.name ?? rowKey;
}

function tableTitle(type: Tab) {
  return { project: '销售项目', source: '销售渠道', payment: '收款方式', store: '门店' }[type];
}

const sportMeta: Record<string, { name: string; color: string }> = {
  badmintonVenue: { name: '羽毛球馆', color: 'bg-cyan-500' },
  fitnessVenue: { name: '健身馆', color: 'bg-emerald-500' },
  basketballVenue: { name: '篮球馆', color: 'bg-orange-500' },
  swimmingVenue: { name: '游泳馆', color: 'bg-blue-500' },
};

function money(value: number) {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

export default App;
