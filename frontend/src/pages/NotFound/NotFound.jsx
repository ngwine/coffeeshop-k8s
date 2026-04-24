import React from "react";
import styled from "styled-components";

const NotFound = () => {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <StyledWrapper>
      <div className="content">
        <div className="visual">
          <div className="text_404">
            <div className="text_4041">4</div>
            <div className="text_4042">0</div>
            <div className="text_4043">4</div>
          </div>

          <div className="main_wrapper">
            <div className="main">
              <div className="antenna">
                <div className="antenna_shadow" />
                <div className="a1" />
                <div className="a1d" />
                <div className="a2" />
                <div className="a2d" />
                <div className="a_base" />
              </div>

              <div className="tv">
                <div className="cruve">
                  <svg
                    xmlSpace="preserve"
                    viewBox="0 0 189.929 189.929"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    className="curve_svg"
                  >
                    <path d="M70.343,70.343c-30.554,30.553-44.806,72.7-39.102,115.635l-29.738,3.951C-5.442,137.659,11.917,86.34,49.129,49.13
        C86.34,11.918,137.664-5.445,189.928,1.502l-3.95,29.738C143.041,25.54,100.895,39.789,70.343,70.343z" />
                  </svg>
                </div>
                <div className="display_div">
                  <div className="screen_out">
                    <div className="screen_out1">
                      <div className="screenM">
                        <span className="notfound_text">NOT FOUND</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lines">
                  <div className="line1" />
                  <div className="line2" />
                  <div className="line3" />
                </div>
                <div className="buttons_div">
                  <div className="b1">
                    <div />
                  </div>
                  <div className="b2" />
                  <div className="speakers">
                    <div className="g1">
                      <div className="g11" />
                      <div className="g12" />
                      <div className="g13" />
                    </div>
                    <div className="g" />
                    <div className="g" />
                  </div>
                </div>
              </div>

              <div className="bottom">
                <div className="base1" />
                <div className="base2" />
                <div className="base3" />
              </div>
            </div>
          </div>
        </div>

        <div className="copy">
          <h1>Oops, page not found</h1>
          <p>
            Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
            <br />
            Thử quay lại trang trước hoặc về trang chủ thưởng cho mình một ly
            cà phê ☕️
          </p>
          <div className="actions">
            <a href="/" className="btn primary">
              Về trang chủ
            </a>
            <button type="button" className="btn ghost" onClick={handleBack}>
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  width: 100%;
  padding: 3rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1f2937 0, #020617 50%, #000 100%);
  color: #f9fafb;
  overflow: hidden;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;

  /* noise / scanline background */
  &::before {
    content: "";
    position: absolute;
    inset: -40px;
    opacity: 0.18;
    pointer-events: none;
    background-image: repeating-linear-gradient(
        0deg,
        rgba(148, 163, 184, 0.14),
        rgba(148, 163, 184, 0.14) 1px,
        transparent 1px,
        transparent 3px
      ),
      radial-gradient(circle at 0 0, rgba(248, 113, 113, 0.4), transparent 55%),
      radial-gradient(
        circle at 100% 100%,
        rgba(251, 191, 36, 0.35),
        transparent 55%
      );
    mix-blend-mode: soft-light;
    animation: noiseMove 1.3s steps(2) infinite;
  }

  @keyframes noiseMove {
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(-10px, 10px, 0);
    }
  }

  .content {
    position: relative;
    z-index: 1;
    max-width: 1050px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 3rem;
    flex-wrap: wrap;
  }

  .visual {
    flex: 1 1 320px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .copy {
    flex: 1 1 280px;
    max-width: 400px;
  }

  .copy h1 {
    font-size: 2.1rem;
    margin-bottom: 0.75rem;
    font-weight: 700;
  }

  .copy p {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #e5e7eb;
    margin-bottom: 1.4rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .btn {
    border-radius: 999px;
    padding: 0.55rem 1.3rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    text-decoration: none;
    transition: transform 0.12s ease, box-shadow 0.12s ease,
      background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
  }

  .btn.primary {
    background: linear-gradient(135deg, #f97316, #ec4899);
    color: #ffffff;
    box-shadow: 0 18px 40px rgba(236, 72, 153, 0.45);
  }

  .btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 22px 55px rgba(236, 72, 153, 0.65);
  }

  .btn.ghost {
    background: transparent;
    color: #e5e7eb;
    border-color: #4b5563;
  }

  .btn.ghost:hover {
    background: rgba(15, 23, 42, 0.9);
    border-color: #f97316;
    color: #ffffff;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.6);
  }

  /* ========= big 404 text behind TV ========= */
  .text_404 {
    position: absolute;
    inset: auto 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: row;
    column-gap: 3.5rem;
    align-items: center;
    justify-content: center;
    opacity: 0.4;
    font-family: "Montserrat", system-ui, sans-serif;
    font-weight: 800;
    font-size: 2.5rem;
    color: #020617;
    text-shadow: 0 0 0 rgba(148, 163, 184, 0.6);
    z-index: 0;
    pointer-events: none;
  }

  .text_4041,
  .text_4042,
  .text_4043 {
    transform: scaleY(7) scaleX(3);
    letter-spacing: 0.05em;
    animation: glow404 3.2s ease-in-out infinite;
  }

  .text_4042 {
    animation-delay: 0.2s;
  }
  .text_4043 {
    animation-delay: 0.4s;
  }

  @keyframes glow404 {
    0% {
      text-shadow: 0 0 10px rgba(248, 250, 252, 0.15),
        0 0 40px rgba(249, 115, 22, 0.1);
      opacity: 0.35;
    }
    50% {
      text-shadow: 0 0 18px rgba(248, 250, 252, 0.3),
        0 0 70px rgba(249, 115, 22, 0.4);
      opacity: 0.7;
    }
    100% {
      text-shadow: 0 0 10px rgba(248, 250, 252, 0.15),
        0 0 40px rgba(249, 115, 22, 0.1);
      opacity: 0.35;
    }
  }

  .main_wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30em;
    height: 30em;
  }

  .main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 5em;
    animation: floatTv 4.1s ease-in-out infinite;
  }

  @keyframes floatTv {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }

  .antenna {
    width: 5em;
    height: 5em;
    border-radius: 50%;
    border: 2px solid black;
    background-color: #f27405;
    margin-bottom: -6em;
    margin-left: 0em;
    z-index: 1;
    position: relative;
  }

  .antenna_shadow {
    position: absolute;
    background-color: transparent;
    width: 50px;
    height: 56px;
    margin-left: 1.68em;
    border-radius: 45%;
    transform: rotate(140deg);
    border: 4px solid transparent;
    box-shadow: inset 0px 16px #a85103, inset 0px 16px 1px 1px #a85103;
    -moz-box-shadow: inset 0px 16px #a85103, inset 0px 16px 1px 1px #a85103;
  }

  .antenna::after {
    content: "";
    position: absolute;
    margin-top: -9.4em;
    margin-left: 0.4em;
    transform: rotate(-25deg);
    width: 1em;
    height: 0.5em;
    border-radius: 50%;
    background-color: #f69e50;
  }

  .antenna::before {
    content: "";
    position: absolute;
    margin-top: 0.2em;
    margin-left: 1.25em;
    transform: rotate(-20deg);
    width: 1.5em;
    height: 0.8em;
    border-radius: 50%;
    background-color: #f69e50;
  }

  .a1 {
    position: relative;
    top: -102%;
    left: -130%;
    width: 12em;
    height: 5.5em;
    border-radius: 50px;
    background-image: linear-gradient(
      #171717,
      #171717,
      #353535,
      #353535,
      #171717
    );
    transform: rotate(-29deg);
    clip-path: polygon(50% 0%, 49% 100%, 52% 100%);
  }

  .a1d {
    position: relative;
    top: -211%;
    left: -35%;
    transform: rotate(45deg);
    width: 0.5em;
    height: 0.5em;
    border-radius: 50%;
    border: 2px solid black;
    background-color: #979797;
    z-index: 99;
  }

  .a2 {
    position: relative;
    top: -210%;
    left: -10%;
    width: 12em;
    height: 4em;
    border-radius: 50px;
    background-color: #171717;
    background-image: linear-gradient(
      #171717,
      #171717,
      #353535,
      #353535,
      #171717
    );
    margin-right: 5em;
    clip-path: polygon(
      47% 0,
      47% 0,
      34% 34%,
      54% 25%,
      32% 100%,
      29% 96%,
      49% 32%,
      30% 38%
    );
    transform: rotate(-8deg);
  }

  .a2d {
    position: relative;
    top: -294%;
    left: 94%;
    width: 0.5em;
    height: 0.5em;
    border-radius: 50%;
    border: 2px solid black;
    background-color: #979797;
    z-index: 99;
  }

  .tv {
    width: 17em;
    height: 9em;
    margin-top: 3em;
    border-radius: 15px;
    background-color: #d36604;
    display: flex;
    justify-content: center;
    border: 2px solid #1d0e01;
    box-shadow: inset 0.2em 0.2em #e69635;
    position: relative;
    overflow: hidden;
  }

  .tv::after {
    content: "";
    position: absolute;
    width: 17em;
    height: 9em;
    border-radius: 15px;
    background: repeating-radial-gradient(#d36604 0 0.0001%, #00000070 0 0.0002%)
        50% 0/2500px 2500px,
      repeating-conic-gradient(#d36604 0 0.0001%, #00000070 0 0.0002%) 60% 60%/2500px
        2500px;
    background-blend-mode: difference;
    opacity: 0.12;
    pointer-events: none;
  }

  .curve_svg {
    position: absolute;
    margin-top: 0.25em;
    margin-left: -0.25em;
    height: 12px;
    width: 12px;
  }

  .display_div {
    display: flex;
    align-items: center;
    align-self: center;
    justify-content: center;
    border-radius: 15px;
    box-shadow: 3.5px 3.5px 0px #e69635;
  }

  .screen_out {
    width: auto;
    height: auto;
    border-radius: 10px;
  }

  .screen_out1 {
    width: 11em;
    height: 7.75em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .screenM {
    width: 13em;
    height: 7.85em;
    position: relative;
    font-family: "Montserrat", system-ui, sans-serif;
    background: linear-gradient(
      to right,
      #002fc6 0%,
      #002bb2 14.2857142857%,
      #3a3a3a 14.2857142857%,
      #303030 28.5714285714%,
      #ff0afe 28.5714285714%,
      #f500f4 42.8571428571%,
      #6c6c6c 42.8571428571%,
      #626262 57.1428571429%,
      #0affd9 57.1428571429%,
      #00f5ce 71.4285714286%,
      #3a3a3a 71.4285714286%,
      #303030 85.7142857143%,
      white 85.7142857143%,
      #fafafa 100%
    );
    border-radius: 10px;
    border: 2px solid black;
    z-index: 99;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #252525;
    letter-spacing: 0.15em;
    text-align: center;
    overflow: hidden;
    animation: screenFlicker 2.7s infinite steps(2, end);
  }

  @keyframes screenFlicker {
    0% {
      filter: brightness(1);
      transform: translateY(0);
    }
    10% {
      filter: brightness(0.9);
      transform: translateY(0.5px);
    }
    20% {
      filter: brightness(1.05);
      transform: translateY(-0.5px);
    }
    35% {
      filter: brightness(0.95);
      transform: translateY(0.3px);
    }
    50% {
      filter: brightness(1.1);
      transform: translateY(-0.4px);
    }
    100% {
      filter: brightness(1);
      transform: translateY(0);
    }
  }

  .screenM:before,
  .screenM:after {
    content: "";
    position: absolute;
    left: 0;
    z-index: 1;
    width: 100%;
  }

  .screenM:before {
    top: 0;
    height: 68.4782608696%;
    background: linear-gradient(
      to right,
      white 0%,
      #fafafa 14.2857142857%,
      #ffe60a 14.2857142857%,
      #f5dc00 28.5714285714%,
      #0affd9 28.5714285714%,
      #00f5ce 42.8571428571%,
      #10ea00 42.8571428571%,
      #0ed600 57.1428571429%,
      #ff0afe 57.1428571429%,
      #f500f4 71.4285714286%,
      #ed0014 71.4285714286%,
      #d90012 85.7142857143%,
      #002fc6 85.7142857143%,
      #002bb2 100%
    );
  }

  .screenM:after {
    bottom: 0;
    height: 21.7391304348%;
    background: linear-gradient(
      to right,
      #006c6b 0%,
      #005857 16.6666666667%,
      white 16.6666666667%,
      #fafafa 33.3333333333%,
      #001b75 33.3333333333%,
      #001761 50%,
      #6c6c6c 50%,
      #626262 66.6666666667%,
      #929292 66.6666666667%,
      #888888 83.3333333333%,
      #3a3a3a 83.3333333333%,
      #303030 100%
    );
  }

  .notfound_text {
    background-color: black;
    padding: 0.2em 0.4em;
    font-size: 0.75em;
    color: white;
    letter-spacing: 0.08em;
    border-radius: 5px;
    z-index: 10;
    position: relative;
    text-shadow: 0 0 10px rgba(15, 23, 42, 0.8);
    animation: textGlitch 1.9s infinite;
  }

  @keyframes textGlitch {
    0%,
    100% {
      transform: translate(0);
      clip-path: inset(0 0 0 0);
    }
    10% {
      transform: translate(1px, -1px);
      clip-path: inset(0 0 40% 0);
    }
    20% {
      transform: translate(-1px, 1px);
      clip-path: inset(60% 0 0 0);
    }
    30% {
      transform: translate(0.5px, -0.5px);
      clip-path: inset(0 0 20% 0);
    }
    40% {
      transform: translate(-0.5px, 0.5px);
      clip-path: inset(40% 0 0 0);
    }
    50% {
      transform: translate(0);
      clip-path: inset(0 0 0 0);
    }
  }

  .lines {
    display: flex;
    column-gap: 0.1em;
    align-self: flex-end;
  }

  .line1,
  .line3 {
    width: 2px;
    height: 0.5em;
    background-color: black;
    border-radius: 25px 25px 0px 0px;
    margin-top: 0.5em;
  }

  .line2 {
    flex-grow: 1;
    width: 2px;
    height: 1em;
    background-color: black;
    border-radius: 25px 25px 0px 0px;
  }

  .buttons_div {
    width: 4.25em;
    align-self: center;
    height: 8em;
    background-color: #e69635;
    border: 2px solid #1d0e01;
    padding: 0.6em;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    row-gap: 0.75em;
    box-shadow: 3px 3px 0px #e69635;
  }

  .b1,
  .b2 {
    width: 1.65em;
    height: 1.65em;
    border-radius: 50%;
    background-color: #7f5934;
    border: 2px solid black;
    box-shadow: inset 2px 2px 1px #b49577, -2px 0px #513721,
      -2px 0px 0px 1px black;
  }

  .b1::before {
    content: "";
    position: absolute;
    margin-top: 1em;
    margin-left: 0.5em;
    transform: rotate(47deg);
    border-radius: 5px;
    width: 0.1em;
    height: 0.4em;
    background-color: #000000;
  }

  .b1::after {
    content: "";
    position: absolute;
    margin-top: 0.9em;
    margin-left: 0.8em;
    transform: rotate(47deg);
    border-radius: 5px;
    width: 0.1em;
    height: 0.55em;
    background-color: #000000;
  }

  .b1 div {
    content: "";
    position: absolute;
    margin-top: -0.1em;
    margin-left: 0.65em;
    transform: rotate(45deg);
    width: 0.15em;
    height: 1.5em;
    background-color: #000000;
  }

  .b2::before {
    content: "";
    position: absolute;
    margin-top: 1.05em;
    margin-left: 0.8em;
    transform: rotate(-45deg);
    border-radius: 5px;
    width: 0.15em;
    height: 0.4em;
    background-color: #000000;
  }

  .b2::after {
    content: "";
    position: absolute;
    margin-top: -0.1em;
    margin-left: 0.65em;
    transform: rotate(-45deg);
    width: 0.15em;
    height: 1.5em;
    background-color: #000000;
  }

  .speakers {
    display: flex;
    flex-direction: column;
    row-gap: 0.5em;
  }

  .speakers .g1 {
    display: flex;
    column-gap: 0.25em;
  }

  .speakers .g11,
  .g12,
  .g13 {
    width: 0.65em;
    height: 0.65em;
    border-radius: 50%;
    background-color: #7f5934;
    border: 2px solid black;
    box-shadow: inset 1.25px 1.25px 1px #b49577;
  }

  .speakers .g {
    width: auto;
    height: 2px;
    background-color: #171717;
  }

  .bottom {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: 8.7em;
  }

  .base1,
  .base2 {
    height: 1em;
    width: 2em;
    border: 2px solid #171717;
    background-color: #4d4d4d;
    margin-top: -0.15em;
    z-index: -1;
  }

  .base3 {
    position: absolute;
    height: 0.15em;
    width: 17.5em;
    background-color: #171717;
    margin-top: 0.8em;
  }

  /* responsive */
  @media (max-width: 900px) {
    .content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .copy {
      max-width: 480px;
    }

    .actions {
      justify-content: center;
    }

    .text_404 {
      column-gap: 2rem;
    }
  }

  @media (max-width: 640px) {
    .main_wrapper {
      transform: scale(0.85);
      height: 24em;
    }

    .text_404 {
      transform: translateY(-50%) scale(0.8);
    }
  }
`;

export default NotFound;
