export type RequirementTemplate = {
  id: string
  name: string
  prompt: string
}

export const requirementTemplates: RequirementTemplate[] = [
  {
    id: "bug",
    name: "Bug 修复",
    prompt:
      "【问题现象】\n\n【复现步骤】\n1.\n2.\n\n【期望结果】\n\n【实际结果】\n\n【影响范围】\n\n【优先级】\n\n#bug",
  },
  {
    id: "feature",
    name: "功能需求",
    prompt:
      "【背景】\n\n【目标】\n\n【用户故事】\n作为……我希望……以便……\n\n【验收标准】\n- \n\n【范围/非范围】\n\n【优先级】\n\n#feature",
  },
  {
    id: "opt",
    name: "优化/性能",
    prompt:
      "【现状】\n\n【问题】\n\n【目标指标】\n\n【方案】\n\n【风险】\n\n【验收标准】\n- \n\n#optimization",
  },
]

