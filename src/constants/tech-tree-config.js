/**
 * 科技树系统配置
 * 当建筑升级到3级（最高级）时，可以解锁科技树
 * 每个建筑可以有多个科技分支，科技之间有依赖关系
 */

/**
 * 科技效果类型
 */
export const TECH_EFFECT_TYPES = {
  OUTPUT: 'output', // 产出加成
  POLLUTION: 'pollution', // 污染变化
  STABILITY: 'stability', // 稳定度加成
  POPULATION: 'population', // 人口加成
  POWER: 'power', // 电力相关
  EFFICIENCY: 'efficiency', // 效率加成
  CAPACITY: 'capacity', // 容量加成
}

/**
 * 科技配置数据结构
 * @typedef {object} TechConfig
 * @property {string} id - 科技唯一ID
 * @property {string} buildingType - 所属建筑类型
 * @property {string} name - 科技名称（多语言）
 * @property {string} description - 科技描述（多语言）
 * @property {string} icon - 科技图标（emoji）
 * @property {number} cost - 研发成本（金币）
 * @property {string[]} prerequisites - 前置科技ID列表（依赖关系）
 * @property {object} effects - 科技效果
 * @property {number} order - 显示顺序
 */

/**
 * 科技树配置
 * 按建筑类型组织
 */
export const TECH_TREE_CONFIGS = {
  // ===================== 工厂科技树 =====================
  factory: [
    {
      id: 'tech_factory_automation',
      buildingType: 'factory',
      name: {
        zh: '自动化生产',
        en: 'Automation Production',
      },
      description: {
        zh: '引入自动化设备，提升工厂产出效率',
        en: 'Introduce automation equipment to improve factory output efficiency',
      },
      icon: '🤖',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.3, // 产出+30%
        [TECH_EFFECT_TYPES.STABILITY]: 0.05, // 稳定度+5%（居民幸福度提升）
      },
      order: 1,
    },
    {
      id: 'tech_factory_eco',
      buildingType: 'factory',
      name: {
        zh: '环保改造',
        en: 'Eco-Friendly Upgrade',
      },
      description: {
        zh: '采用环保技术，大幅降低污染',
        en: 'Adopt eco-friendly technology to significantly reduce pollution',
      },
      icon: '🌿',
      cost: 2500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.4, // 污染-40%
        [TECH_EFFECT_TYPES.STABILITY]: 0.08, // 稳定度+8%（环境改善）
      },
      order: 2,
    },
    {
      id: 'tech_factory_smart',
      buildingType: 'factory',
      name: {
        zh: '智能工厂',
        en: 'Smart Factory',
      },
      description: {
        zh: '集成物联网和AI技术，实现智能化生产',
        en: 'Integrate IoT and AI technology for intelligent production',
      },
      icon: '🧠',
      cost: 4000,
      prerequisites: ['tech_factory_automation'], // 需要先研发自动化
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.5, // 产出+50%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.2, // 效率+20%
        [TECH_EFFECT_TYPES.POWER]: -0.15, // 电力消耗-15%
      },
      order: 3,
    },
    {
      id: 'tech_factory_zero_pollution',
      buildingType: 'factory',
      name: {
        zh: '零污染技术',
        en: 'Zero Pollution Technology',
      },
      description: {
        zh: '实现完全零污染生产，成为环保典范',
        en: 'Achieve completely zero-pollution production, becoming an environmental model',
      },
      icon: '♻️',
      cost: 5000,
      prerequisites: ['tech_factory_eco'], // 需要先研发环保改造
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -1.0, // 污染-100%（零污染）
        [TECH_EFFECT_TYPES.STABILITY]: 0.15, // 稳定度+15%
        [TECH_EFFECT_TYPES.OUTPUT]: 0.1, // 产出+10%（环保品牌效应）
      },
      order: 4,
    },
  ],

  // ===================== 化学工厂科技树 =====================
  chemistry_factory: [
    {
      id: 'tech_chemistry_safety',
      buildingType: 'chemistry_factory',
      name: {
        zh: '安全防护系统',
        en: 'Safety Protection System',
      },
      description: {
        zh: '加强安全防护，降低事故风险，提升稳定度',
        en: 'Strengthen safety protection, reduce accident risk, improve stability',
      },
      icon: '🛡️',
      cost: 3000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.2, // 污染-20%（安全措施减少泄漏）
      },
      order: 1,
    },
    {
      id: 'tech_chemistry_advanced',
      buildingType: 'chemistry_factory',
      name: {
        zh: '先进化学工艺',
        en: 'Advanced Chemical Process',
      },
      description: {
        zh: '采用先进化学工艺，提升产出和效率',
        en: 'Adopt advanced chemical processes to improve output and efficiency',
      },
      icon: '⚗️',
      cost: 3500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.4, // 产出+40%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.25, // 效率+25%
      },
      order: 2,
    },
    {
      id: 'tech_chemistry_green',
      buildingType: 'chemistry_factory',
      name: {
        zh: '绿色化学技术',
        en: 'Green Chemistry Technology',
      },
      description: {
        zh: '采用绿色化学技术，大幅降低污染',
        en: 'Adopt green chemistry technology to significantly reduce pollution',
      },
      icon: '🌱',
      cost: 4500,
      prerequisites: ['tech_chemistry_safety'], // 需要先研发安全防护
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.5, // 污染-50%
        [TECH_EFFECT_TYPES.STABILITY]: 0.12, // 稳定度+12%
        [TECH_EFFECT_TYPES.OUTPUT]: 0.15, // 产出+15%
      },
      order: 3,
    },
    {
      id: 'tech_chemistry_ai',
      buildingType: 'chemistry_factory',
      name: {
        zh: 'AI化学合成',
        en: 'AI Chemical Synthesis',
      },
      description: {
        zh: '使用AI优化化学合成过程，实现智能化生产',
        en: 'Use AI to optimize chemical synthesis processes for intelligent production',
      },
      icon: '🔬',
      cost: 6000,
      prerequisites: ['tech_chemistry_advanced', 'tech_chemistry_green'], // 需要两个前置科技
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.6, // 产出+60%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.3, // 效率+30%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.3, // 污染-30%
        [TECH_EFFECT_TYPES.POWER]: -0.2, // 电力消耗-20%
      },
      order: 4,
    },
  ],

  // ===================== 商店科技树 =====================
  shop: [
    {
      id: 'tech_shop_digital',
      buildingType: 'shop',
      name: {
        zh: '数字化经营',
        en: 'Digital Operations',
      },
      description: {
        zh: '引入数字化系统，提升经营效率',
        en: 'Introduce digital systems to improve operational efficiency',
      },
      icon: '💻',
      cost: 1500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.25, // 收入+25%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.15, // 效率+15%
      },
      order: 1,
    },
    {
      id: 'tech_shop_smart',
      buildingType: 'shop',
      name: {
        zh: '智能零售',
        en: 'Smart Retail',
      },
      description: {
        zh: '采用智能零售技术，提升顾客体验和收入',
        en: 'Adopt smart retail technology to improve customer experience and revenue',
      },
      icon: '🛒',
      cost: 3000,
      prerequisites: ['tech_shop_digital'], // 需要先研发数字化
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.45, // 收入+45%
        [TECH_EFFECT_TYPES.STABILITY]: 0.06, // 稳定度+6%（顾客满意度提升）
      },
      order: 2,
    },
    {
      id: 'tech_shop_eco',
      buildingType: 'shop',
      name: {
        zh: '绿色商店',
        en: 'Green Store',
      },
      description: {
        zh: '采用环保材料和节能技术',
        en: 'Adopt eco-friendly materials and energy-saving technology',
      },
      icon: '🌳',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.3, // 污染-30%
        [TECH_EFFECT_TYPES.POWER]: -0.2, // 电力消耗-20%
        [TECH_EFFECT_TYPES.STABILITY]: 0.05, // 稳定度+5%
      },
      order: 3,
    },
  ],

  // ===================== 办公室科技树 =====================
  office: [
    {
      id: 'tech_office_remote',
      buildingType: 'office',
      name: {
        zh: '远程办公系统',
        en: 'Remote Work System',
      },
      description: {
        zh: '建立远程办公系统，提升工作效率和员工满意度',
        en: 'Establish remote work system to improve work efficiency and employee satisfaction',
      },
      icon: '🏠',
      cost: 2500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.3, // 收入+30%
        [TECH_EFFECT_TYPES.STABILITY]: 0.08, // 稳定度+8%（员工满意度）
        [TECH_EFFECT_TYPES.POWER]: -0.15, // 电力消耗-15%
      },
      order: 1,
    },
    {
      id: 'tech_office_ai',
      buildingType: 'office',
      name: {
        zh: 'AI办公助手',
        en: 'AI Office Assistant',
      },
      description: {
        zh: '集成AI办公助手，大幅提升工作效率',
        en: 'Integrate AI office assistant to significantly improve work efficiency',
      },
      icon: '🤖',
      cost: 4000,
      prerequisites: ['tech_office_remote'], // 需要先研发远程办公
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.5, // 收入+50%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.3, // 效率+30%
      },
      order: 2,
    },
    {
      id: 'tech_office_green',
      buildingType: 'office',
      name: {
        zh: '绿色办公',
        en: 'Green Office',
      },
      description: {
        zh: '采用绿色办公理念，降低环境影响',
        en: 'Adopt green office concepts to reduce environmental impact',
      },
      icon: '🌿',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.25, // 污染-25%
        [TECH_EFFECT_TYPES.POWER]: -0.25, // 电力消耗-25%
        [TECH_EFFECT_TYPES.STABILITY]: 0.06, // 稳定度+6%
      },
      order: 3,
    },
  ],

  // ===================== 住宅科技树 =====================
  house: [
    {
      id: 'tech_house_smart',
      buildingType: 'house',
      name: {
        zh: '智能家居',
        en: 'Smart Home',
      },
      description: {
        zh: '安装智能家居系统，提升居住体验和人口容量',
        en: 'Install smart home systems to improve living experience and population capacity',
      },
      icon: '🏡',
      cost: 1800,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POPULATION]: 0.2, // 人口容量+20%
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%（居住满意度）
        [TECH_EFFECT_TYPES.POWER]: -0.1, // 电力消耗-10%（智能节能）
      },
      order: 1,
    },
    {
      id: 'tech_house_eco',
      buildingType: 'house',
      name: {
        zh: '生态住宅',
        en: 'Eco-Friendly Residence',
      },
      description: {
        zh: '采用生态建筑技术，降低污染和能耗',
        en: 'Adopt eco-friendly building technology to reduce pollution and energy consumption',
      },
      icon: '🌳',
      cost: 2200,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.3, // 污染-30%
        [TECH_EFFECT_TYPES.POWER]: -0.2, // 电力消耗-20%
        [TECH_EFFECT_TYPES.STABILITY]: 0.08, // 稳定度+8%
      },
      order: 2,
    },
    {
      id: 'tech_house_community',
      buildingType: 'house',
      name: {
        zh: '社区服务',
        en: 'Community Services',
      },
      description: {
        zh: '建立完善的社区服务体系，大幅提升居民满意度',
        en: 'Establish comprehensive community service system to significantly improve resident satisfaction',
      },
      icon: '👥',
      cost: 3000,
      prerequisites: ['tech_house_smart'], // 需要先研发智能家居
      effects: {
        [TECH_EFFECT_TYPES.STABILITY]: 0.15, // 稳定度+15%
        [TECH_EFFECT_TYPES.POPULATION]: 0.15, // 人口容量+15%
        [TECH_EFFECT_TYPES.OUTPUT]: 0.1, // 产出+10%（社区经济）
      },
      order: 3,
    },
  ],

  // ===================== 学校科技树 =====================
  school: [
    {
      id: 'tech_school_quality',
      buildingType: 'school',
      name: {
        zh: '优质教育',
        en: 'Quality Education',
      },
      description: {
        zh: '提升教学质量，增加人口容量加成',
        en: 'Improve teaching quality to increase population capacity bonus',
      },
      icon: '📚',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POPULATION]: 0.1, // 人口容量加成+10%（影响范围）
        [TECH_EFFECT_TYPES.STABILITY]: 0.05, // 稳定度+5%
      },
      order: 1,
    },
    {
      id: 'tech_school_vocational',
      buildingType: 'school',
      name: {
        zh: '职业教育',
        en: 'Vocational Education',
      },
      description: {
        zh: '开展职业教育，提升商业和工业建筑效率',
        en: 'Provide vocational education to improve commercial and industrial building efficiency',
      },
      icon: '🔧',
      cost: 3000,
      prerequisites: ['tech_school_quality'], // 需要先研发优质教育
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.15, // 影响范围内建筑产出+15%
        [TECH_EFFECT_TYPES.STABILITY]: 0.08, // 稳定度+8%
      },
      order: 2,
    },
    {
      id: 'tech_school_research',
      buildingType: 'school',
      name: {
        zh: '科研中心',
        en: 'Research Center',
      },
      description: {
        zh: '建立科研中心，大幅提升教育影响范围和效果',
        en: 'Establish research center to significantly improve education impact range and effects',
      },
      icon: '🔬',
      cost: 5000,
      prerequisites: ['tech_school_vocational'], // 需要先研发职业教育
      effects: {
        [TECH_EFFECT_TYPES.POPULATION]: 0.2, // 人口容量加成+20%
        [TECH_EFFECT_TYPES.OUTPUT]: 0.1, // 影响范围内建筑产出+10%
        [TECH_EFFECT_TYPES.STABILITY]: 0.12, // 稳定度+12%
      },
      order: 3,
    },
  ],

  // ===================== 民宅科技树 =====================
  house2: [
    {
      id: 'tech_house2_solar',
      buildingType: 'house2',
      name: {
        zh: '太阳能屋顶',
        en: 'Solar Roof',
      },
      description: {
        zh: '安装太阳能屋顶，实现能源自给',
        en: 'Install solar roof to achieve energy self-sufficiency',
      },
      icon: '☀️',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POWER]: -0.5, // 电力消耗-50%（自给自足）
        [TECH_EFFECT_TYPES.POLLUTION]: -0.2, // 污染-20%
        [TECH_EFFECT_TYPES.STABILITY]: 0.08, // 稳定度+8%
      },
      order: 1,
    },
    {
      id: 'tech_house2_garden',
      buildingType: 'house2',
      name: {
        zh: '屋顶花园',
        en: 'Roof Garden',
      },
      description: {
        zh: '建设屋顶花园，提升居住环境和人口容量',
        en: 'Build roof garden to improve living environment and population capacity',
      },
      icon: '🌺',
      cost: 1500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POPULATION]: 0.15, // 人口容量+15%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.15, // 污染-15%
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%
      },
      order: 2,
    },
    {
      id: 'tech_house2_smart',
      buildingType: 'house2',
      name: {
        zh: '智能民宅',
        en: 'Smart House',
      },
      description: {
        zh: '全面智能化改造，提升居住体验',
        en: 'Comprehensive smart transformation to improve living experience',
      },
      icon: '🏠',
      cost: 3500,
      prerequisites: ['tech_house2_solar', 'tech_house2_garden'], // 需要两个前置科技
      effects: {
        [TECH_EFFECT_TYPES.POPULATION]: 0.25, // 人口容量+25%
        [TECH_EFFECT_TYPES.STABILITY]: 0.15, // 稳定度+15%
        [TECH_EFFECT_TYPES.POWER]: -0.3, // 电力消耗-30%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.2, // 污染-20%
      },
      order: 3,
    },
  ],

  // ===================== 垃圾站科技树 =====================
  garbage_station: [
    {
      id: 'tech_garbage_recycle',
      buildingType: 'garbage_station',
      name: {
        zh: '垃圾分类回收',
        en: 'Waste Sorting & Recycling',
      },
      description: {
        zh: '建立垃圾分类回收系统，提升处理能力',
        en: 'Establish waste sorting and recycling system to improve processing capacity',
      },
      icon: '♻️',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.CAPACITY]: 0.3, // 处理能力+30%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.2, // 污染-20%（减少污染）
        [TECH_EFFECT_TYPES.OUTPUT]: 0.1, // 产出+10%（回收收益）
      },
      order: 1,
    },
    {
      id: 'tech_garbage_black',
      buildingType: 'garbage_station',
      name: {
        zh: '黑科技处理',
        en: 'Black Tech Processing',
      },
      description: {
        zh: '采用前沿黑科技，大幅提升垃圾处理能力和效率',
        en: 'Adopt cutting-edge black technology to significantly improve waste processing capacity and efficiency',
      },
      icon: '⚫',
      cost: 4000,
      prerequisites: ['tech_garbage_recycle'], // 需要先研发垃圾分类
      effects: {
        [TECH_EFFECT_TYPES.CAPACITY]: 0.6, // 处理能力+60%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.4, // 效率+40%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.4, // 污染-40%
        [TECH_EFFECT_TYPES.OUTPUT]: 0.2, // 产出+20%（资源回收）
      },
      order: 2,
    },
    {
      id: 'tech_garbage_zero',
      buildingType: 'garbage_station',
      name: {
        zh: '零废弃技术',
        en: 'Zero Waste Technology',
      },
      description: {
        zh: '实现零废弃处理，所有垃圾都能回收利用',
        en: 'Achieve zero waste processing, all waste can be recycled',
      },
      icon: '🌍',
      cost: 6000,
      prerequisites: ['tech_garbage_black'], // 需要先研发黑科技
      effects: {
        [TECH_EFFECT_TYPES.CAPACITY]: 1.0, // 处理能力+100%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.6, // 污染-60%
        [TECH_EFFECT_TYPES.OUTPUT]: 0.3, // 产出+30%（完全回收）
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%（环境改善）
      },
      order: 3,
    },
  ],

  // ===================== 公园科技树 =====================
  hero_park: [
    {
      id: 'tech_park_eco',
      buildingType: 'hero_park',
      name: {
        zh: '生态公园',
        en: 'Ecological Park',
      },
      description: {
        zh: '建设生态公园，提升环境质量和影响范围',
        en: 'Build ecological park to improve environmental quality and impact range',
      },
      icon: '🌳',
      cost: 1500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.3, // 污染-30%（增强减污效果）
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%
      },
      order: 1,
    },
    {
      id: 'tech_park_smart',
      buildingType: 'hero_park',
      name: {
        zh: '智能公园',
        en: 'Smart Park',
      },
      description: {
        zh: '引入智能管理系统，提升公园服务能力',
        en: 'Introduce smart management system to improve park service capacity',
      },
      icon: '🤖',
      cost: 2500,
      prerequisites: ['tech_park_eco'], // 需要先研发生态公园
      effects: {
        [TECH_EFFECT_TYPES.STABILITY]: 0.15, // 稳定度+15%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.2, // 污染-20%（智能优化）
      },
      order: 2,
    },
    {
      id: 'tech_park_carbon',
      buildingType: 'hero_park',
      name: {
        zh: '碳汇技术',
        en: 'Carbon Sink Technology',
      },
      description: {
        zh: '采用碳汇技术，大幅提升环境改善能力',
        en: 'Adopt carbon sink technology to significantly improve environmental improvement capacity',
      },
      icon: '🌲',
      cost: 4000,
      prerequisites: ['tech_park_smart'], // 需要先研发智能公园
      effects: {
        [TECH_EFFECT_TYPES.POLLUTION]: -0.5, // 污染-50%
        [TECH_EFFECT_TYPES.STABILITY]: 0.2, // 稳定度+20%
      },
      order: 3,
    },
  ],

  // ===================== 太阳能板科技树 =====================
  sun_power: [
    {
      id: 'tech_solar_efficiency',
      buildingType: 'sun_power',
      name: {
        zh: '高效太阳能',
        en: 'High-Efficiency Solar',
      },
      description: {
        zh: '采用高效太阳能技术，提升发电效率',
        en: 'Adopt high-efficiency solar technology to improve power generation efficiency',
      },
      icon: '☀️',
      cost: 2000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.3, // 发电量+30%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.2, // 效率+20%
      },
      order: 1,
    },
    {
      id: 'tech_solar_storage',
      buildingType: 'sun_power',
      name: {
        zh: '储能技术',
        en: 'Energy Storage Technology',
      },
      description: {
        zh: '集成储能系统，提升电力供应稳定性',
        en: 'Integrate energy storage system to improve power supply stability',
      },
      icon: '🔋',
      cost: 3000,
      prerequisites: ['tech_solar_efficiency'], // 需要先研发高效太阳能
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.2, // 发电量+20%（储能释放）
        [TECH_EFFECT_TYPES.STABILITY]: 0.08, // 稳定度+8%（电力稳定）
      },
      order: 2,
    },
    {
      id: 'tech_solar_ai',
      buildingType: 'sun_power',
      name: {
        zh: 'AI智能追踪',
        en: 'AI Smart Tracking',
      },
      description: {
        zh: '使用AI优化太阳能板角度，最大化发电效率',
        en: 'Use AI to optimize solar panel angles for maximum power generation efficiency',
      },
      icon: '🧠',
      cost: 5000,
      prerequisites: ['tech_solar_storage'], // 需要先研发储能技术
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.5, // 发电量+50%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.4, // 效率+40%
      },
      order: 3,
    },
  ],

  // ===================== 风力发电科技树 =====================
  wind_power: [
    {
      id: 'tech_wind_advanced',
      buildingType: 'wind_power',
      name: {
        zh: '先进风机技术',
        en: 'Advanced Wind Turbine Technology',
      },
      description: {
        zh: '采用先进风机技术，提升发电效率',
        en: 'Adopt advanced wind turbine technology to improve power generation efficiency',
      },
      icon: '💨',
      cost: 2500,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.35, // 发电量+35%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.25, // 效率+25%
      },
      order: 1,
    },
    {
      id: 'tech_wind_offshore',
      buildingType: 'wind_power',
      name: {
        zh: '海上风电技术',
        en: 'Offshore Wind Technology',
      },
      description: {
        zh: '借鉴海上风电技术，大幅提升发电能力',
        en: 'Learn from offshore wind technology to significantly improve power generation capacity',
      },
      icon: '🌊',
      cost: 4000,
      prerequisites: ['tech_wind_advanced'], // 需要先研发先进风机
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.6, // 发电量+60%
        [TECH_EFFECT_TYPES.STABILITY]: 0.05, // 稳定度+5%（能源安全）
      },
      order: 2,
    },
  ],

  // ===================== 核电站科技树 =====================
  nuke_factory: [
    {
      id: 'tech_nuke_safety',
      buildingType: 'nuke_factory',
      name: {
        zh: '安全防护升级',
        en: 'Safety Protection Upgrade',
      },
      description: {
        zh: '加强核电站安全防护，提升稳定度',
        en: 'Strengthen nuclear power plant safety protection to improve stability',
      },
      icon: '🛡️',
      cost: 5000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.STABILITY]: 0.15, // 稳定度+15%（安全提升）
        [TECH_EFFECT_TYPES.POLLUTION]: -0.2, // 污染-20%（减少泄漏风险）
      },
      order: 1,
    },
    {
      id: 'tech_nuke_fusion',
      buildingType: 'nuke_factory',
      name: {
        zh: '核聚变技术',
        en: 'Nuclear Fusion Technology',
      },
      description: {
        zh: '采用核聚变技术，大幅提升发电效率和安全性',
        en: 'Adopt nuclear fusion technology to significantly improve power generation efficiency and safety',
      },
      icon: '⚛️',
      cost: 8000,
      prerequisites: ['tech_nuke_safety'], // 需要先研发安全防护
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.5, // 发电量+50%
        [TECH_EFFECT_TYPES.POLLUTION]: -0.4, // 污染-40%
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%
      },
      order: 2,
    },
  ],

  // ===================== 主题公园科技树 =====================
  theme_park: [
    {
      id: 'tech_theme_park_attraction',
      buildingType: 'theme_park',
      name: {
        zh: '新增游乐设施',
        en: 'New Attractions',
      },
      description: {
        zh: '增加更多游乐设施，提升游客满意度和收入',
        en: 'Add more attractions to improve visitor satisfaction and income',
      },
      icon: '🎡',
      cost: 5000,
      prerequisites: [],
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.25, // 收入+25%
        [TECH_EFFECT_TYPES.STABILITY]: 0.05, // 稳定度+5%
      },
      order: 1,
    },
    {
      id: 'tech_theme_park_marketing',
      buildingType: 'theme_park',
      name: {
        zh: '营销推广',
        en: 'Marketing Campaign',
      },
      description: {
        zh: '加强营销推广，吸引更多游客，提升商业建筑收益',
        en: 'Strengthen marketing to attract more visitors and boost commercial building revenue',
      },
      icon: '📢',
      cost: 6000,
      prerequisites: ['tech_theme_park_attraction'], // 需要先研发新增游乐设施
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.15, // 收入+15%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.1, // 影响范围内商业建筑效率+10%
      },
      order: 2,
    },
    {
      id: 'tech_theme_park_vip',
      buildingType: 'theme_park',
      name: {
        zh: 'VIP服务',
        en: 'VIP Services',
      },
      description: {
        zh: '提供VIP服务，大幅提升收入并增强对周围商业建筑的影响',
        en: 'Provide VIP services to significantly increase revenue and enhance impact on surrounding commercial buildings',
      },
      icon: '👑',
      cost: 8000,
      prerequisites: ['tech_theme_park_marketing'], // 需要先研发营销推广
      effects: {
        [TECH_EFFECT_TYPES.OUTPUT]: 0.3, // 收入+30%
        [TECH_EFFECT_TYPES.STABILITY]: 0.1, // 稳定度+10%
        [TECH_EFFECT_TYPES.EFFICIENCY]: 0.15, // 影响范围内商业建筑效率+15%
      },
      order: 3,
    },
  ],
}

/**
 * 获取指定建筑类型的所有科技
 * @param {string} buildingType - 建筑类型
 * @returns {TechConfig[]} 科技配置列表
 */
export function getTechsByBuildingType(buildingType) {
  return TECH_TREE_CONFIGS[buildingType] || []
}

/**
 * 获取所有科技配置
 * @returns {TechConfig[]} 所有科技配置
 */
export function getAllTechs() {
  return Object.values(TECH_TREE_CONFIGS).flat()
}

/**
 * 根据ID获取科技配置
 * @param {string} techId - 科技ID
 * @returns {TechConfig|null} 科技配置
 */
export function getTechById(techId) {
  const allTechs = getAllTechs()
  return allTechs.find(tech => tech.id === techId) || null
}

/**
 * 检查科技是否已解锁（前置科技是否都已研发）
 * @param {string} techId - 科技ID
 * @param {string[]} researchedTechs - 已研发的科技ID列表
 * @returns {boolean} 是否已解锁
 */
export function isTechUnlocked(techId, researchedTechs = []) {
  const tech = getTechById(techId)
  if (!tech) return false

  // 如果没有前置科技，直接解锁
  if (!tech.prerequisites || tech.prerequisites.length === 0) {
    return true
  }

  // 检查所有前置科技是否都已研发
  return tech.prerequisites.every(prereqId => researchedTechs.includes(prereqId))
}

/**
 * 获取科技树可视化数据（用于UI显示）
 * @param {string} buildingType - 建筑类型
 * @param {string[]} researchedTechs - 已研发的科技ID列表
 * @returns {object} 科技树数据
 */
export function getTechTreeData(buildingType, researchedTechs = []) {
  const techs = getTechsByBuildingType(buildingType)
  
  return {
    buildingType,
    techs: techs.map(tech => ({
      ...tech,
      unlocked: isTechUnlocked(tech.id, researchedTechs),
      researched: researchedTechs.includes(tech.id),
    })),
  }
}

