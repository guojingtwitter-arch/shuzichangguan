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
type DashboardType = 'venue' | 'simpleRevenue' | 'recognition' | 'fitness';
type Project = 'venue' | 'storedCard' | 'courseCard' | 'passCard' | 'goods';
type Source = 'miniProgram' | 'cashier' | 'meituan' | 'douyin';
type Payment = 'wechat' | 'payCode' | 'storedBalance' | 'offline' | 'corporate' | 'free' | 'meituanGroup' | 'douyinGroup';

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
  goods: { name: '商品销售（含直接收款）', short: '商品/直接收款', color: 'bg-rose-500', icon: ShoppingBag },
};

const sourceMeta: Record<Source, { name: string; tag?: string; color: string }> = {
  miniProgram: { name: '小程序', color: 'bg-blue-500' },
  cashier: { name: '收银台', color: 'bg-sky-500' },
  meituan: { name: '美团核销', tag: '第三方团购', color: 'bg-yellow-500' },
  douyin: { name: '抖音核销', tag: '第三方团购', color: 'bg-fuchsia-500' },
};

const paymentMeta: Record<Payment, { name: string; revenue: boolean; note: string; icon: typeof Wallet }> = {
  wechat: { name: '微信支付', revenue: true, note: '线上直收', icon: Wallet },
  payCode: { name: '商户扫码', revenue: true, note: '收银台扫码收款', icon: ReceiptText },
  storedBalance: { name: '储值卡支付', revenue: false, note: '余额消耗，不重复计入营收', icon: CreditCard },
  offline: { name: '线下付款', revenue: true, note: '现金或其他线下确认', icon: Store },
  corporate: { name: '对公转账', revenue: true, note: '当日确认收款', icon: Landmark },
  free: { name: '无需支付', revenue: false, note: '金额为 0，保留订单数', icon: CircleDollarSign },
  meituanGroup: { name: '美团核销实付', revenue: true, note: '第三方团购', icon: TicketCheck },
  douyinGroup: { name: '抖音核销实付', revenue: true, note: '第三方团购', icon: TicketCheck },
};

const orders: RevenueOrder[] = [
  { id: 'R001', store: 'north', project: 'venue', source: 'miniProgram', payment: 'wechat', receivable: 16800, discount: 920, paid: 15880, refund: 360, orders: 79, dateBucket: 'today' },
  { id: 'R002', store: 'north', project: 'venue', source: 'cashier', payment: 'storedBalance', receivable: 8200, discount: 240, paid: 7960, orders: 31, dateBucket: 'today' },
  { id: 'R003', store: 'north', project: 'storedCard', source: 'cashier', payment: 'payCode', receivable: 24000, discount: 1600, paid: 22400, refund: 1000, orders: 18, dateBucket: 'today' },
  { id: 'R004', store: 'river', project: 'courseCard', source: 'miniProgram', payment: 'wechat', receivable: 18600, discount: 1200, paid: 17400, orders: 15, dateBucket: 'today' },
  { id: 'R005', store: 'river', project: 'passCard', source: 'cashier', payment: 'offline', receivable: 12800, discount: 560, paid: 12240, orders: 26, dateBucket: 'today' },
  { id: 'R006', store: 'east', project: 'goods', source: 'cashier', payment: 'payCode', receivable: 6200, discount: 180, paid: 6020, orders: 96, dateBucket: 'today' },
  { id: 'R007', store: 'east', project: 'goods', source: 'cashier', payment: 'offline', receivable: 2380, discount: 0, paid: 2380, orders: 34, dateBucket: 'today' },
  { id: 'R008', store: 'north', project: 'venue', source: 'meituan', payment: 'meituanGroup', receivable: 9400, discount: 700, paid: 8700, refund: 240, orders: 44, dateBucket: 'today' },
  { id: 'R009', store: 'river', project: 'venue', source: 'douyin', payment: 'douyinGroup', receivable: 7600, discount: 520, paid: 7080, orders: 39, dateBucket: 'today' },
  { id: 'R010', store: 'east', project: 'courseCard', source: 'cashier', payment: 'corporate', receivable: 22000, discount: 2000, paid: 20000, orders: 3, dateBucket: 'today' },
  { id: 'R011', store: 'north', project: 'passCard', source: 'miniProgram', payment: 'free', receivable: 1200, discount: 1200, paid: 0, orders: 6, dateBucket: 'today' },
  { id: 'W001', store: 'north', project: 'venue', source: 'miniProgram', payment: 'wechat', receivable: 68600, discount: 4200, paid: 64400, refund: 2800, orders: 318, dateBucket: 'week' },
  { id: 'W002', store: 'river', project: 'storedCard', source: 'cashier', payment: 'payCode', receivable: 82000, discount: 5600, paid: 76400, orders: 55, dateBucket: 'week' },
  { id: 'W003', store: 'east', project: 'goods', source: 'cashier', payment: 'offline', receivable: 21400, discount: 640, paid: 20760, orders: 302, dateBucket: 'week' },
  { id: 'W004', store: 'river', project: 'courseCard', source: 'douyin', payment: 'douyinGroup', receivable: 34600, discount: 2600, paid: 32000, refund: 1200, orders: 128, dateBucket: 'week' },
  { id: 'W005', store: 'north', project: 'venue', source: 'meituan', payment: 'meituanGroup', receivable: 29600, discount: 1800, paid: 27800, orders: 116, dateBucket: 'week' },
  { id: 'M001', store: 'north', project: 'venue', source: 'cashier', payment: 'storedBalance', receivable: 144000, discount: 6200, paid: 137800, refund: 4200, orders: 472, dateBucket: 'month' },
  { id: 'M002', store: 'river', project: 'courseCard', source: 'miniProgram', payment: 'wechat', receivable: 210000, discount: 13000, paid: 197000, orders: 160, dateBucket: 'month' },
  { id: 'M003', store: 'east', project: 'storedCard', source: 'cashier', payment: 'corporate', receivable: 188000, discount: 11200, paid: 176800, orders: 86, dateBucket: 'month' },
  { id: 'M004', store: 'east', project: 'passCard', source: 'miniProgram', payment: 'wechat', receivable: 118000, discount: 7800, paid: 110200, orders: 264, dateBucket: 'month' },
  { id: 'M005', store: 'north', project: 'goods', source: 'cashier', payment: 'payCode', receivable: 39000, discount: 1100, paid: 37900, orders: 691, dateBucket: 'month' },
  { id: 'M006', store: 'river', project: 'venue', source: 'meituan', payment: 'meituanGroup', receivable: 76000, discount: 5200, paid: 70800, refund: 3600, orders: 298, dateBucket: 'month' },
  { id: 'M007', store: 'east', project: 'venue', source: 'douyin', payment: 'douyinGroup', receivable: 62000, discount: 4200, paid: 57800, orders: 233, dateBucket: 'month' },
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
  category: 'timeCard' | 'privateCourse' | 'goods';
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
];

const recognitionCategoryMeta = {
  timeCard: { name: '次卡/时间卡销售', icon: CreditCard },
  privateCourse: { name: '私教课程销售', icon: TicketCheck },
  goods: { name: '商品销售', icon: ShoppingBag },
} satisfies Record<RecognitionCardSale['category'], { name: string; icon: typeof CreditCard }>;

const recognitionCategoryRevenueTitle = {
  timeCard: '次卡/时间卡本月确认收入',
  privateCourse: '私教课程本月确认收入',
  goods: '商品销售本月确认收入',
} satisfies Record<RecognitionCardSale['category'], string>;

const defaultRecognitionMonth = '2026-06';

const recognitionMonthOptions = [
  { id: '2026-04', name: '2026年4月' },
  { id: '2026-05', name: '2026年5月' },
  { id: '2026-06', name: '2026年6月' },
  { id: '2026-07', name: '2026年7月' },
  { id: '2026-08', name: '2026年8月' },
];

function App() {
  const [dashboard, setDashboard] = useState<DashboardType>('venue');
  const [period, setPeriod] = useState<Period>('today');
  const [store, setStore] = useState<StoreId>('all');
  const [tab, setTab] = useState<Tab>('project');
  const [selectedProject, setSelectedProject] = useState<Project>('passCard');

  const filteredOrders = useMemo(() => {
    const bucket = period === 'custom' ? ['today', 'week'] : [period];
    return orders.filter((order) => {
      const inScope = dashboard === 'venue' || dashboard === 'simpleRevenue' || (order.project !== 'venue' && order.project !== 'storedCard');
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
            { id: 'venue', label: '营收看板', icon: BarChart3 },
            { id: 'simpleRevenue', label: '营收报表', icon: CircleDollarSign },
            { id: 'recognition', label: '健身行业确认收入看板', icon: ReceiptText },
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
              <h1 className="mt-1 text-xl font-black text-slate-800">{dashboard === 'recognition' ? '健身行业确认收入看板' : dashboard === 'simpleRevenue' ? '营收统计' : '收入分析看板'}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
          {dashboard === 'recognition' ? (
            <RecognitionIncomeDashboard store={store} onStoreChange={setStore} />
          ) : dashboard === 'simpleRevenue' ? (
            <SimpleRevenueDashboard period={period} store={store} onPeriodChange={setPeriod} onStoreChange={setStore} orders={filteredOrders} />
          ) : (
            <>
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
            <Segmented value={period} onChange={setPeriod} />
            <SelectBox icon={Building2} value={store} onChange={(value) => setStore(value as StoreId)} options={stores} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="font-semibold text-slate-500">统计区间：{activePeriod.range}，仅统计支付成功 / 核销完成订单，不含退款、撤单、作废订单。</div>
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              实际营收 = 总销售额 - 储值卡支付；美团/抖音计入实际营收并标注第三方团购。
            </div>
          </div>

          <section className={cn('mt-4 grid gap-2.5', dashboard === 'fitness' ? 'md:grid-cols-2 xl:grid-cols-5' : 'xl:grid-cols-[1.4fr_1fr]')}>
            {dashboard === 'fitness' ? (
              <>
                <MetricCard title="实际营收总额" value={money(totals.actualRevenue)} helper="全部渠道实际营收" />
                <MetricCard title="小程序营收" value={money(miniProgramRevenue)} helper="小程序实际营收" />
                <MetricCard title="收银台营收" value={money(cashierRevenue)} helper="收银台实际营收" />
                <MetricCard title="美团核销" value={money(totals.meituan)} helper="第三方团购核销" />
                <MetricCard title="抖音核销" value={money(totals.douyin)} helper="第三方团购核销" />
              </>
            ) : (
              <>
                <RevenueTotalCard total={totals.actualRevenue} miniProgramRevenue={miniProgramRevenue} cashierRevenue={cashierRevenue} meituanRevenue={totals.meituan} douyinRevenue={totals.douyin} />
                <SalesBreakdownCards sales={totals.sales} storedBalance={totals.storedBalance} actualRevenue={totals.actualRevenue} />
              </>
            )}
          </section>

          <section className="mt-4">
            <Panel title="项目统计" icon={BarChart3} subtitle="按实际营收统计">
              <ProjectSummary rows={projectRows} orders={filteredOrders} selectedProject={selectedProject} onSelectProject={setSelectedProject} dashboard={dashboard} />
            </Panel>
          </section>

          <section className="mt-4">
            <Panel title="多维明细" icon={ArrowDownToLine}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'project', name: '销售项目' },
                    { id: 'source', name: '购买来源' },
                    { id: 'payment', name: '付款方式' },
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
              {tab === 'project' && <DataTable rows={projectRows} type="project" total={totals.actualRevenue} dashboard={dashboard} />}
              {tab === 'source' && <DataTable rows={sourceRows} type="source" total={totals.actualRevenue} dashboard={dashboard} />}
              {tab === 'payment' && <DataTable rows={paymentRows} type="payment" total={totals.actualRevenue} dashboard={dashboard} />}
              {tab === 'store' && <DataTable rows={storeRows} type="store" total={totals.actualRevenue} dashboard={dashboard} />}
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
                <Definition label="美团核销实付" value={`${money(totals.meituan)}，第三方团购`} />
                <Definition label="抖音核销实付" value={`${money(totals.douyin)}，第三方团购`} />
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


function SimpleRevenueDashboard({
  period,
  store,
  onPeriodChange,
  onStoreChange,
  orders,
}: {
  period: Period;
  store: StoreId;
  onPeriodChange: (period: Period) => void;
  onStoreChange: (store: StoreId) => void;
  orders: RevenueOrder[];
}) {
  const totals = useMemo(() => summarize(orders), [orders]);
  const projectRows = useMemo(() => orderProjectRows(groupBy(orders, 'project')), [orders]);
  const sourceRows = useMemo(() => groupBy(orders, 'source'), [orders]);
  const paymentRows = useMemo(
    () => groupBy(orders.filter((order) => paymentMeta[order.payment].revenue), 'payment'),
    [orders],
  );
  const trendRows = useMemo(() => buildRevenueTrend(orders), [orders]);
  const activePeriod = periods.find((item) => item.id === period)!;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <Segmented value={period} onChange={onPeriodChange} />
        <SelectBox icon={Building2} value={store} onChange={(value) => onStoreChange(value as StoreId)} options={stores} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-semibold text-slate-500">统计区间：{activePeriod.range}，按付款时间归属收入。</div>
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          实际营收金额 = 销售总额 - 退款金额 - 储值卡消耗金额
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-lg border border-emerald-500 bg-emerald-600 p-5 text-white shadow-sm shadow-emerald-200/60">
          <div className="text-xs font-bold text-white/70">实际营收金额</div>
          <div className="mt-2 text-4xl font-black tracking-normal sm:text-5xl">{money(totals.actualRevenue)}</div>
          <div className="mt-3 text-xs font-semibold leading-5 text-white/70">扣除退款及储值卡余额消耗后的本期经营净收入。</div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <MiniMetric label="销售总额" value={money(totals.sales)} />
            <MiniMetric label="退款金额" value={money(totals.refund)} tone="warning" />
            <MiniMetric label="储值卡消耗" value={money(totals.storedBalance)} tone="muted" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm shadow-slate-200/40">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <ReceiptText size={17} />
            财务口径
          </div>
          <div className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-600">
            <p>销售总额为统计期内已支付订单金额，退款金额作为销售冲减项。</p>
            <p>储值卡消耗金额属于预收余额使用，本期不重复确认为实际营收。</p>
            <p>储值卡销售作为独立营收项目计入销售总额。</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SimpleRankPanel title="按营收项目" rows={projectRows} type="project" total={totals.actualRevenue} />
        <SimpleRankPanel title="按销售渠道" rows={sourceRows} type="source" total={totals.actualRevenue} />
        <SimpleRankPanel title="按收款方式" rows={paymentRows} type="payment" total={Math.max(totals.actualRevenue, 1)} caption="不含储值卡支付" />
      </section>

      <Panel title="实际营收趋势" icon={BarChart3} subtitle="净额口径">
        <RevenueTrend rows={trendRows} />
      </Panel>
    </div>
  );
}

function MiniMetric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'warning' | 'muted' }) {
  return (
    <div className={cn('rounded-md px-3 py-2.5', tone === 'warning' ? 'bg-amber-400/20' : tone === 'muted' ? 'bg-white/10' : 'bg-white/15')}>
      <div className="text-[11px] font-bold text-white/65">{label}</div>
      <div className="mt-1 text-lg font-black tabular-nums">{value}</div>
    </div>
  );
}

function SimpleRankPanel({
  title,
  rows,
  type,
  total,
  caption,
}: {
  title: string;
  rows: { key: string; total: ReturnType<typeof summarize> }[];
  type: 'project' | 'source' | 'payment';
  total: number;
  caption?: string;
}) {
  return (
    <Panel title={title} icon={type === 'payment' ? Wallet : type === 'source' ? Store : BarChart3} action={caption}>
      <div className="space-y-3">
        {rows.map((row) => {
          const amount = Math.max(row.total.actualRevenue, 0);
          const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm font-bold">
                <div className="min-w-0 flex-1"><RowName rowKey={row.key} type={type} /></div>
                <div className="shrink-0 text-right tabular-nums text-slate-900">{money(amount)}</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function RevenueTrend({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3">
      {rows.map((row) => (
        <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end rounded-md bg-slate-50 px-1.5 pt-2">
            <div
              className="w-full rounded-t-md bg-emerald-500"
              style={{ height: `${Math.max((row.value / max) * 100, 8)}%` }}
              title={`${row.label} ${money(row.value)}`}
            />
          </div>
          <div className="w-full truncate text-center text-[11px] font-bold text-slate-500">{row.label}</div>
        </div>
      ))}
    </div>
  );
}

function buildRevenueTrend(rows: RevenueOrder[]) {
  const labels = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];
  const total = summarize(rows).actualRevenue;
  const weights = [0.08, 0.12, 0.1, 0.16, 0.18, 0.24, 0.12];
  let used = 0;

  return labels.map((label, index) => {
    const isLast = index === labels.length - 1;
    const value = isLast ? Math.max(total - used, 0) : Math.max(Math.round(total * weights[index]), 0);
    used += value;
    return { label, value };
  });
}

function RecognitionIncomeDashboard({ store, onStoreChange }: { store: StoreId; onStoreChange: (store: StoreId) => void }) {
  const [selectedCategory, setSelectedCategory] = useState<RecognitionCardSale['category']>('timeCard');
  const [detailTab, setDetailTab] = useState<'recognized' | 'pending'>('recognized');
  const [recognitionMonth, setRecognitionMonth] = useState(defaultRecognitionMonth);
  const cards = useMemo(() => recognitionCardSales.filter((item) => store === 'all' || item.store === store), [store]);
  const activeCards = useMemo(() => cards.filter((item) => getRecognitionPeriodIndex(item, recognitionMonth) !== null), [cards, recognitionMonth]);
  const pendingDetailCards = useMemo(() => cards.filter((item) => item.category !== 'goods' && getPendingRecognitionAmount(item, recognitionMonth) > 0), [cards, recognitionMonth]);
  const metrics = useMemo(() => recognitionMetrics(cards, recognitionMonth), [cards, recognitionMonth]);
  const currentSalesRecognized = metrics.currentSalesRecognized;
  const historySalesRecognized = metrics.historySalesRecognized;
  const currentRecognized = metrics.currentRecognized;
  const monthlyPending = metrics.monthlyPending;
  const historyPending = metrics.historyPending;
  const monthlySalesTotal = metrics.monthlySalesTotal;
  const pendingBalance = metrics.pending;
  const categoryRows = useMemo(() => groupRecognitionByCategory(activeCards, cards, recognitionMonth), [activeCards, cards, recognitionMonth]);
  const productRows = useMemo(() => groupRecognitionByProduct(activeCards, cards, selectedCategory, recognitionMonth), [activeCards, cards, selectedCategory, recognitionMonth]);
  const storeRows = useMemo(() => groupRecognitionByStore(cards, store, recognitionMonth), [cards, store, recognitionMonth]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <SelectBox icon={CalendarDays} value={recognitionMonth} onChange={setRecognitionMonth} options={recognitionMonthOptions} />
        <SelectBox icon={Building2} value={store} onChange={(value) => onStoreChange(value as StoreId)} options={fitnessStores} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-semibold text-slate-500">统计月份：{recognitionMonth}，确认收入按自然月归属，以支付购买时间为确认起点。</div>
        <div className="rounded-md bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
          单期确认金额 = 实收金额 ÷ 确认期数；最后一期倒挤平账。
        </div>
      </div>

      <section className="mt-4 grid gap-2.5 lg:grid-cols-3">
        <MetricCard
          title="本月确认收入"
          value={money(currentRecognized)}
          accent="bg-blue-600 text-white ring-1 ring-blue-500"
          large
          details={[
            { label: '本月新售确认', value: money(currentSalesRecognized) },
            { label: '往期销售确认', value: money(historySalesRecognized) },
          ]}
        />
        <MetricCard
          title="本月销售金额"
          value={money(monthlySalesTotal)}
          details={[
            { label: '当月确认收入', value: money(currentSalesRecognized) },
            { label: '后续待确认', value: money(monthlyPending) },
          ]}
        />
        <MetricCard
          title="待确认收入余额"
          value={money(pendingBalance)}
          details={[
            { label: '本月新增待确认', value: money(monthlyPending) },
            { label: '往期剩余待确认', value: money(historyPending) },
          ]}
        />
      </section>

      <section className="mt-4">
        <Panel title="项目统计" icon={CreditCard} subtitle="按销售分类统计">
          <RecognitionCategorySummary rows={categoryRows} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <div className="mt-4">
            <RecognitionProductTable rows={productRows} category={selectedCategory} />
          </div>
        </Panel>
      </section>

      <section className="mt-4">
        <Panel title="门店确认收入统计" icon={Building2}>
          <RecognitionStoreTable rows={storeRows} />
        </Panel>
      </section>

      <section className="mt-4">
        <Panel
          title="收入明细"
          icon={ReceiptText}
          action={
            <button className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
              <Download size={14} />
              导出
            </button>
          }
        >
          <div className="mb-3 flex rounded-md bg-slate-50 p-1 text-sm font-bold">
            {[
              { id: 'recognized', label: '本月确认收入明细' },
              { id: 'pending', label: '待确认收入明细' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setDetailTab(item.id as 'recognized' | 'pending')}
                className={cn('h-9 flex-1 rounded px-3 transition', detailTab === item.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
              >
                {item.label}
              </button>
            ))}
          </div>
          <RecognitionDetailTable rows={detailTab === 'recognized' ? activeCards : pendingDetailCards} month={recognitionMonth} />
        </Panel>
      </section>

      <section className="mt-4 rounded-lg border border-slate-100 bg-white px-3.5 py-3 shadow-sm shadow-slate-200/30">
        <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
          <CircleDollarSign size={16} />
          关键统计口径说明
        </div>
        <div className="flex flex-wrap gap-2">
          <Definition label="本月确认收入" value="本月新售确认 + 往期销售确认" />
          <Definition label="本月销售金额" value="本月新售确认 + 本月新售待确认" />
          <Definition label="待确认收入余额" value="本月新售待确认 + 往期销售待确认" />
          <Definition label="确认周期" value="按商品设置期数，自支付购买月份起按自然月确认" />
          <Definition label="尾差处理" value="前 N-1 期均分，最后一期倒挤平账" />
          <Definition label="商品销售" value="一次性确认为本月收入，不产生待确认收入" />
        </div>
      </section>
    </>
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
                <div className="truncate text-slate-400">本月新售确认</div>
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
            <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">本月确认收入</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">本月销售金额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">本月新售确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">本月新售待确认</th>
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
            <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">本月确认收入</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">本月销售金额</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">本月新售确认</th>
            <th className="border-b border-slate-100 px-3 py-3 text-right">本月新售待确认</th>
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
              <th className="border-b border-slate-100 px-3 py-3 text-right">截止本月已确认期数</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">待确认期数</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">本月确认收入</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">本月销售金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">待确认收入余额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">本月新售确认</th>
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

function summarize(rows: RevenueOrder[]) {
  const base = rows.reduce(
    (acc, row) => {
      acc.receivable += row.receivable;
      acc.discount += row.discount;
      acc.sales += row.paid;
      acc.orders += row.orders;
      acc.refund += row.refund ?? 0;
      if (row.payment === 'storedBalance') acc.storedBalance += row.paid;
      if (row.project === 'storedCard') acc.storedCardRevenue += row.paid;
      if (row.payment === 'meituanGroup') acc.meituan += row.paid;
      if (row.payment === 'douyinGroup') acc.douyin += row.paid;
      return acc;
    },
    { receivable: 0, discount: 0, sales: 0, refund: 0, storedBalance: 0, storedCardRevenue: 0, meituan: 0, douyin: 0, orders: 0 },
  );

  return { ...base, actualRevenue: base.sales - base.refund - base.storedBalance };
}

function groupBy<T extends keyof RevenueOrder>(rows: RevenueOrder[], key: T) {
  const grouped = new Map<string, RevenueOrder[]>();
  rows.forEach((row) => {
    const value = String(row[key]);
    grouped.set(value, [...(grouped.get(value) ?? []), row]);
  });

  return Array.from(grouped.entries())
    .map(([groupKey, groupRows]) => ({ key: groupKey, total: summarize(groupRows) }))
    .sort((a, b) => b.total.actualRevenue - a.total.actualRevenue);
}

function orderProjectRows(rows: { key: string; total: ReturnType<typeof summarize> }[]) {
  return [...rows].sort((a, b) => {
    if (a.key === 'passCard') return -1;
    if (b.key === 'passCard') return 1;
    return b.total.actualRevenue - a.total.actualRevenue;
  });
}

function Segmented({ value, onChange }: { value: Period; onChange: (value: Period) => void }) {
  return (
    <div className="flex h-10 rounded-md bg-white p-1 ring-1 ring-slate-200">
      {periods.map((item) => (
        <button key={item.id} onClick={() => onChange(item.id)} className={cn('min-w-16 rounded px-3 text-sm font-bold', value === item.id ? 'bg-blue-600 text-white' : 'text-slate-600')}>
          {item.name}
        </button>
      ))}
    </div>
  );
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
  meituanRevenue,
  douyinRevenue,
}: {
  total: number;
  miniProgramRevenue: number;
  cashierRevenue: number;
  meituanRevenue: number;
  douyinRevenue: number;
}) {
  const items = [
    { label: '小程序营收', value: miniProgramRevenue },
    { label: '收银台营收', value: cashierRevenue },
    { label: '美团核销', value: meituanRevenue },
    { label: '抖音核销', value: douyinRevenue },
  ];

  return (
    <div className="rounded-lg border border-blue-500 bg-blue-600 p-4 text-white shadow-sm shadow-blue-200/60">
      <div className="text-xs font-bold text-white/70">实际营收总额</div>
      <div className="mt-1.5 text-4xl font-black tracking-normal">{money(total)}</div>
      <div className="mt-2 text-[11px] font-semibold text-white/65">小程序 + 收银台 + 美团核销 + 抖音核销</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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

function SalesBreakdownCards({ sales, storedBalance, actualRevenue }: {
  sales: number;
  storedBalance: number;
  actualRevenue: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-100 bg-white p-3.5 shadow-sm shadow-slate-200/40">
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-bold text-slate-500">总销售额</div>
          <div className="mt-2 text-3xl font-black tracking-normal text-slate-800">{money(sales)}</div>
          <div className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">含储值卡消费</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-xs font-bold text-slate-500">储值卡支付</div>
          <div className="mt-2 text-3xl font-black tracking-normal text-slate-800">{money(storedBalance)}</div>
          <div className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">用于扣减营收</div>
        </div>
      </div>
      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700">
        总销售额 {money(sales)} - 储值卡支付 {money(storedBalance)} = 实际营收 {money(actualRevenue)}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, action, subtitle, children }: { title: string; icon: typeof Store; action?: ReactNode; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex min-h-11 items-center justify-between border-b border-slate-100 px-3.5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-black">
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
              <div className="mt-2 text-xl font-black text-slate-800">{money(row.total.actualRevenue)}</div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-semibold">
                {sourceTotals.map(({ source, total }) => (
                  <div key={source} className="min-w-0 rounded bg-white/70 px-1.5 py-1">
                    <div className="truncate text-slate-400">
                      {sourceMeta[source].name}
                    </div>
                    <div className="mt-0.5 truncate text-slate-600">{money(total.actualRevenue)}</div>
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
          <div className="mt-1 text-xs font-bold text-slate-500">点击项目卡片切换明细，主要统计口径为实际营收。</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-bold text-white">
            <Download size={15} />
            导出
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
        <table className={cn('w-full border-separate border-spacing-0 text-sm', isFitness ? 'min-w-[520px]' : 'min-w-[720px]')}>
          <thead>
            <tr className="text-xs font-black text-slate-500">
              <th className="border-b border-slate-100 px-3 py-3 text-left">明细项目</th>
              {!isFitness && <th className="border-b border-slate-100 px-3 py-3 text-right text-blue-700">总销售额</th>}
              {!isFitness && <th className="border-b border-slate-100 px-3 py-3 text-right">储值卡支付</th>}
              <th className="border-b border-slate-100 px-3 py-3 text-right text-indigo-700">实际营收</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">优惠金额</th>
              <th className="border-b border-slate-100 px-3 py-3 text-right">订单数</th>
            </tr>
          </thead>
          <tbody>
            {visibleDetails.map((detail) => (
              <tr key={detail.name} className="font-bold text-slate-800">
                <td className="border-b border-slate-100 px-3 py-3">{detail.name}</td>
                {!isFitness && <td className="border-b border-slate-100 bg-blue-50/40 px-3 py-3 text-right tabular-nums text-blue-700">{money(detail.sales)}</td>}
                {!isFitness && <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(detail.storedBalance)}</td>}
                <td className="border-b border-slate-100 bg-indigo-50/40 px-3 py-3 text-right tabular-nums text-indigo-700">{money(detail.actualRevenue)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(detail.discount)}</td>
                <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{detail.orders}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 text-sm font-black text-slate-800">
              <td className="border-b border-slate-100 px-3 py-3">合计</td>
              {!isFitness && <td className="border-b border-slate-100 bg-blue-50/60 px-3 py-3 text-right tabular-nums text-blue-700">{money(total.sales)}</td>}
              {!isFitness && <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(total.storedBalance)}</td>}
              <td className="border-b border-slate-100 bg-indigo-50/60 px-3 py-3 text-right tabular-nums text-indigo-700">{money(total.actualRevenue)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{money(total.discount)}</td>
              <td className="border-b border-slate-100 px-3 py-3 text-right tabular-nums">{total.orders}</td>
            </tr>
            {details.length > 4 && (
              <tr>
                <td colSpan={6} className="px-3 py-3 text-center">
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
    const usedRevenue = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.actualRevenue * current.weight), 0);
    const usedOrders = list.slice(0, index).reduce((sum, current) => sum + Math.round(total.orders * current.weight), 0);

    return {
      name: item.name,
      receivable: isLast ? Math.max(total.receivable - usedReceivable, 0) : Math.round(total.receivable * item.weight),
      discount: isLast ? Math.max(total.discount - usedDiscount, 0) : Math.round(total.discount * item.weight),
      sales: isLast ? Math.max(total.sales - usedSales, 0) : Math.round(total.sales * item.weight),
      storedBalance: isLast ? Math.max(total.storedBalance - usedStoredBalance, 0) : Math.round(total.storedBalance * item.weight),
      actualRevenue: isLast ? Math.max(total.actualRevenue - usedRevenue, 0) : Math.round(total.actualRevenue * item.weight),
      orders: isLast ? Math.max(total.orders - usedOrders, 0) : Math.round(total.orders * item.weight),
    };
  });
}

function DataTable({ rows, type, total, dashboard }: { rows: { key: string; total: ReturnType<typeof summarize> }[]; type: Tab; total: number; dashboard: DashboardType }) {
  const isFitness = dashboard === 'fitness';

  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-separate border-spacing-0 text-left text-sm', isFitness ? 'min-w-[520px]' : 'min-w-[680px]')}>
        <thead>
          <tr className="text-xs font-black text-slate-500">
            <th className="w-[210px] border-b border-slate-100 py-3 pr-2">{tableTitle(type)}</th>
            {!isFitness && <th className="border-b border-slate-100 px-2 py-3 text-right text-blue-700">总销售额</th>}
            {!isFitness && <th className="border-b border-slate-100 px-2 py-3 text-right">储值卡支付</th>}
            <th className="border-b border-slate-100 px-2 py-3 text-right text-indigo-700">实际营收</th>
            <th className="border-b border-slate-100 px-2 py-3 text-right">优惠金额</th>
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
              {!isFitness && <td className="border-b border-slate-100 px-2 py-3 text-right tabular-nums">{money(row.total.storedBalance)}</td>}
              <td className="border-b border-slate-100 bg-indigo-50/40 px-2 py-3 text-right tabular-nums text-indigo-700">{money(row.total.actualRevenue)}</td>
              <td className="border-b border-slate-100 px-2 py-3 text-right tabular-nums">{money(row.total.discount)}</td>
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

function RowName({ rowKey, type }: { rowKey: string; type: Tab }) {
  if (type === 'project') {
    const item = projectMeta[rowKey as Project];
    const Icon = item.icon;
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-md text-white', item.color)}>
          <Icon size={16} />
        </span>
        <span className="truncate">{item.name}</span>
      </div>
    );
  }

  if (type === 'source') {
    const item = sourceMeta[rowKey as Source];
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
        <span className="truncate">{item.name}</span>
        {item.tag && <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">{item.tag}</span>}
      </div>
    );
  }

  if (type === 'payment') {
    const item = paymentMeta[rowKey as Payment];
    const Icon = item.icon;
    return (
      <div className="flex min-w-0 items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate">{item.name}</span>
          <span className={cn('mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px]', item.revenue ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500')}>{item.revenue ? '计入实际营收' : '不计入营收'}</span>
        </span>
      </div>
    );
  }

  return stores.find((item) => item.id === rowKey)?.name ?? rowKey;
}

function tableTitle(type: Tab) {
  return { project: '销售项目', source: '购买来源', payment: '付款方式', store: '门店' }[type];
}

function money(value: number) {
  return `¥${Math.round(value).toLocaleString('zh-CN')}`;
}

export default App;
