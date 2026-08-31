import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QGridLayout,
    QLabel, QSpinBox, QPushButton, QGroupBox, QMessageBox
)
from PyQt5.QtCore import Qt

# 能量基础值（同元素微粒 3.0，异元素 1.2，无元素 1.8；晶球分别是微粒的 3 倍）
ENERGY_VALUES = {
    'f_same_p': 3.0, 'f_diff_p': 1.2, 'f_none_p': 1.8,
    'f_same_o': 9.0, 'f_diff_o': 3.6, 'f_none_o': 5.4,
    'b_same_p': 3.0, 'b_diff_p': 1.2, 'b_none_p': 1.8,
    'b_same_o': 9.0, 'b_diff_o': 3.6, 'b_none_o': 5.4
}

class EnergyCalculator(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("原神充能计算器 (PyQt5)")
        self.setMinimumSize(700, 550)
        self.init_ui()
        self.calculate()  # 初始计算

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(12)

        # ===== 粒子输入区域 =====
        particle_group = QGroupBox("微粒 & 晶球吸收")
        particle_layout = QGridLayout()
        particle_group.setLayout(particle_layout)

        # 表头
        headers = ["吸收类型", "同元素微粒", "异元素微粒", "无元素微粒",
                   "同元素晶球", "异元素晶球", "无元素晶球"]
        for col, text in enumerate(headers):
            label = QLabel(text)
            label.setStyleSheet("font-weight: bold; color: #2c3e50;")
            particle_layout.addWidget(label, 0, col)

        # 前台行
        self.front_inputs = {}
        front_labels = ["前台吸收"]
        front_keys = ['f_same_p', 'f_diff_p', 'f_none_p', 'f_same_o', 'f_diff_o', 'f_none_o']
        for col, key in enumerate(front_keys, start=1):
            spin = QSpinBox()
            spin.setRange(0, 999)
            spin.setValue(0)
            spin.valueChanged.connect(self.calculate)
            self.front_inputs[key] = spin
            particle_layout.addWidget(spin, 1, col)
        # 前台标签（合并第一列）
        particle_layout.addWidget(QLabel("前台吸收"), 1, 0)

        # 后台行
        self.back_inputs = {}
        back_keys = ['b_same_p', 'b_diff_p', 'b_none_p', 'b_same_o', 'b_diff_o', 'b_none_o']
        for col, key in enumerate(back_keys, start=1):
            spin = QSpinBox()
            spin.setRange(0, 999)
            spin.setValue(0)
            spin.valueChanged.connect(self.calculate)
            self.back_inputs[key] = spin
            particle_layout.addWidget(spin, 2, col)
        particle_layout.addWidget(QLabel("后台吸收"), 2, 0)

        main_layout.addWidget(particle_group)

        # ===== 配置信息区域 =====
        config_group = QGroupBox("配置信息")
        config_layout = QGridLayout()
        config_group.setLayout(config_layout)

        # 队伍人数
        config_layout.addWidget(QLabel("队伍人数"), 0, 0)
        self.party_spin = QSpinBox()
        self.party_spin.setRange(1, 4)
        self.party_spin.setValue(4)
        self.party_spin.valueChanged.connect(self.calculate)
        config_layout.addWidget(self.party_spin, 0, 1)

        # 所需能量
        config_layout.addWidget(QLabel("所需能量"), 0, 2)
        self.req_energy_spin = QSpinBox()
        self.req_energy_spin.setRange(0, 999)
        self.req_energy_spin.setValue(60)
        self.req_energy_spin.valueChanged.connect(self.calculate)
        config_layout.addWidget(self.req_energy_spin, 0, 3)

        # 固定恢复能量
        config_layout.addWidget(QLabel("固定恢复能量"), 1, 0)
        self.fixed_spin = QSpinBox()
        self.fixed_spin.setRange(0, 999)
        self.fixed_spin.setValue(0)
        self.fixed_spin.valueChanged.connect(self.calculate)
        config_layout.addWidget(self.fixed_spin, 1, 1)

        # 元素充能效率
        config_layout.addWidget(QLabel("元素充能效率 (%)"), 1, 2)
        self.er_spin = QSpinBox()
        self.er_spin.setRange(0, 999)
        self.er_spin.setValue(100)
        self.er_spin.valueChanged.connect(self.calculate)
        config_layout.addWidget(self.er_spin, 1, 3)

        main_layout.addWidget(config_group)

        # ===== 结果显示区域 =====
        result_group = QGroupBox("计算结果")
        result_layout = QVBoxLayout()
        result_group.setLayout(result_layout)

        # 状态
        self.status_label = QLabel("✖ 充能未达标")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setStyleSheet("font-size: 16px; font-weight: bold; padding: 6px;")
        result_layout.addWidget(self.status_label)

        # 最低充能需求
        min_layout = QHBoxLayout()
        min_layout.addWidget(QLabel("最低充能需求:"))
        self.min_er_label = QLabel("∞")
        self.min_er_label.setStyleSheet("font-weight: bold; color: #e74c3c; font-size: 18px;")
        min_layout.addWidget(self.min_er_label)
        min_layout.addStretch()
        result_layout.addLayout(min_layout)

        # 重置按钮
        reset_btn = QPushButton("重置当前队伍数据 (清零)")
        reset_btn.clicked.connect(self.reset_all)
        result_layout.addWidget(reset_btn)

        main_layout.addWidget(result_group)

        # 说明提示
        info_label = QLabel("提示：输入数量后自动计算。本工具仅实现核心充能计算功能，"
                            "原网页的‘产球记录本’和‘时间轴’功能未移植。")
        info_label.setWordWrap(True)
        info_label.setStyleSheet("color: #555; font-size: 12px; margin-top: 6px;")
        main_layout.addWidget(info_label)

    # ===== 计算逻辑 =====
    def get_back_multiplier(self, party_size):
        if party_size == 1:
            return 1.0
        elif party_size == 2:
            return 0.8
        elif party_size == 3:
            return 0.7
        else:
            return 0.6

    def calculate(self):
        # 读取所有输入值
        party_size = self.party_spin.value()
        required_energy = self.req_energy_spin.value()
        fixed_recovery = self.fixed_spin.value()
        er_stat = self.er_spin.value()

        back_multiplier = self.get_back_multiplier(party_size)

        base_energy = 0.0
        # 前台
        for key, spin in self.front_inputs.items():
            count = spin.value()
            base_val = ENERGY_VALUES[key]
            base_energy += count * base_val  # 前台 multiplier = 1.0
        # 后台
        for key, spin in self.back_inputs.items():
            count = spin.value()
            base_val = ENERGY_VALUES[key]
            base_energy += count * base_val * back_multiplier

        total_base_recovery = base_energy + fixed_recovery
        actual_recovery = total_base_recovery * (er_stat / 100.0)

        # 更新状态
        if actual_recovery >= required_energy and required_energy > 0:
            self.status_label.setText("✔ 充能已达标")
            self.status_label.setStyleSheet("font-size: 16px; font-weight: bold; padding: 6px; "
                                            "background-color: #d5f5e3; color: #27ae60; border-radius: 4px;")
        else:
            self.status_label.setText("✖ 充能未达标")
            self.status_label.setStyleSheet("font-size: 16px; font-weight: bold; padding: 6px; "
                                            "background-color: #fadbd8; color: #e74c3c; border-radius: 4px;")

        # 计算最低充能需求
        if total_base_recovery > 0 and required_energy > 0:
            min_er = (required_energy / total_base_recovery) * 100
            self.min_er_label.setText(f"{int(min_er)}%")
            self.min_er_label.setStyleSheet("font-weight: bold; color: #2980b9; font-size: 18px;")
        else:
            self.min_er_label.setText("∞")
            self.min_er_label.setStyleSheet("font-weight: bold; color: #e74c3c; font-size: 18px;")

    def reset_all(self):
        # 清零所有粒子输入
        for spin in self.front_inputs.values():
            spin.setValue(0)
        for spin in self.back_inputs.values():
            spin.setValue(0)
        # 配置恢复默认
        self.party_spin.setValue(4)
        self.req_energy_spin.setValue(60)
        self.fixed_spin.setValue(0)
        self.er_spin.setValue(100)
        # 自动触发计算

def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # 跨平台美观风格
    window = EnergyCalculator()
    window.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()