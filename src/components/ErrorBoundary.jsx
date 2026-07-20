import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="error-boundary">
        <div className="error-boundary__card">
          <span className="error-boundary__icon">⚠️</span>
          <h1>页面加载出错</h1>
          <p className="error-boundary__msg">{error?.message || '未知错误'}</p>
          <p className="error-boundary__hint">
            常见原因：新模块路由忘记 import 组件。请刷新页面；若仍空白，请联系开发者修复。
          </p>
          <button type="button" className="error-boundary__btn" onClick={this.handleReload}>
            返回首页
          </button>
        </div>
      </div>
    )
  }
}
