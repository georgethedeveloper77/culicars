import 'package:flutter/material.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';

class Separator extends StatelessWidget {
  const Separator({this.height = 1, this.color});
  final double height;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        // final double boxWidth = constraints.constrainWidth();
        const double dashWidth = 10.0;
        final double dashHeight = height;
        const int dashCount = 10; //(boxWidth / (2 * dashWidth)).floor();
        return Flex(
          children: List<Widget>.generate(dashCount, (_) {
            return Padding(
              padding: const EdgeInsets.only(right: PsDimens.space2),
              child: SizedBox(
                width: dashWidth,
                height: dashHeight,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: color),
                ),
              ),
            );
          }),
          mainAxisAlignment: MainAxisAlignment.center,
          direction: Axis.horizontal,
        );
      },
    );
  }
}
